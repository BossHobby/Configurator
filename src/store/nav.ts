import { defineStore } from "pinia";
import { Log } from "@/log";
import { useConnectionStore } from "./connection";
import { CrsfSocket } from "./serial/crsf";
import { crsfKey } from "./serial/serial";
import { useTelemetryStore } from "./telemetry";
import {
  CRSF_ADDRESS_CONFIGURATOR,
  CRSF_ADDRESS_FLIGHT_CONTROLLER,
  extendedFrame,
} from "./util/crsf";
import { CrsfTelemetryType } from "./util/crsf-telemetry";
import {
  distance,
  hasCoord,
  type GeoPoint,
  type Mission,
} from "./util/mission";
import {
  CRSF_FRAMETYPE_QUIC_RT,
  NAV_MISSION_ITEMS_MAX,
  NavCommand,
  NavResult,
  decodeStatus,
  encodeCommand,
  encodePing,
  missionCrc,
  sameMissionItem,
  type NavCommandRequest,
  type NavStatus,
} from "./util/quic-rt";

// The firmware sends STATUS for 3 s after the last frame it heard.
const PING_MS = 1000;
const TICK_MS = 100;
// STATUS arrives every 200 ms; resend a command whose ack has not arrived.
const RESEND_MS = 400;
const COMMAND_TIMEOUT_MS = 3000;
const STALE_MS = 1500;
// GPS home goes out on arming and then every 10 s; allow two misses.
const HOME_STALE_MS = 25000;
const TRAIL_MAX = 600;
const TRAIL_MIN_STEP = 1; // meters
const LOG_MAX = 8;

interface PendingCommand {
  id: number;
  label: string;
  // Shown in the log once settled; steps of a longer exchange are not.
  record: boolean;
  frame: Uint8Array<ArrayBuffer>;
  startedAt: number;
  sentAt: number;
}

// Transport and promise plumbing stays outside reactive state.
let socket: CrsfSocket | undefined;
let unsubscribe: (() => void)[] = [];
let timer: ReturnType<typeof setInterval> | undefined;
let lastPing = 0;
let settle: ((result: NavResult) => void) | undefined;

function frame(payload: Uint8Array) {
  return extendedFrame(
    CRSF_FRAMETYPE_QUIC_RT,
    CRSF_ADDRESS_FLIGHT_CONTROLLER,
    CRSF_ADDRESS_CONFIGURATOR,
    payload,
  );
}

export const useNavStore = defineStore("nav", {
  state: () => ({
    connected: false,
    connecting: false,
    status: undefined as NavStatus | undefined,
    updatedAt: 0,
    now: 0,
    trail: [] as GeoPoint[],
    nextId: 1 + Math.floor(Math.random() * 254),
    pending: undefined as PendingCommand | undefined,
    // A mission upload owns the link; another command would cancel it.
    uploading: false,
    // Settled commands, newest first.
    log: [] as { label: string; result: NavResult; at: number }[],
  }),
  getters: {
    // The QUIC_RT link rides the CRSF bridge of a radio link.
    available: () => !!crsfKey(useConnectionStore().target),
    // Armed as last reported, also while the link is stale: losing it in
    // flight must not unlock anything.
    armed: (state) => !!state.status?.armed,
    stale(state): boolean {
      return !state.status || state.now - state.updatedAt > STALE_MS;
    },
    // Live readings combine STATUS with the standard CRSF telemetry on the
    // same bridge; a missing or stale frame reads undefined.
    position(state): GeoPoint | undefined {
      const telemetry = useTelemetryStore();
      const gps = telemetry.gps;
      if (!state.status?.gpsLock || !gps) return undefined;
      if (!telemetry.fresh(CrsfTelemetryType.Gps, state.now)) return undefined;
      return { lat: gps.lat, lon: gps.lon };
    },
    groundSpeed(state): number | undefined {
      const telemetry = useTelemetryStore();
      return telemetry.fresh(CrsfTelemetryType.Gps, state.now)
        ? telemetry.gps?.groundSpeed
        : undefined;
    },
    sats(state): number | undefined {
      const telemetry = useTelemetryStore();
      return telemetry.fresh(CrsfTelemetryType.Gps, state.now)
        ? telemetry.gps?.sats
        : undefined;
    },
    // Degrees true, from attitude yaw.
    heading(state): number | undefined {
      const telemetry = useTelemetryStore();
      const attitude = telemetry.attitude;
      if (!attitude || !telemetry.fresh(CrsfTelemetryType.Attitude, state.now))
        return undefined;
      return ((attitude.yaw * 180) / Math.PI + 360) % 360;
    },
    // Barometer altitude above launch; absent without a barometer.
    altitude(state): { altitude: number; verticalSpeed: number } | undefined {
      const telemetry = useTelemetryStore();
      return telemetry.fresh(CrsfTelemetryType.BaroAltitude, state.now)
        ? telemetry.baroAltitude
        : undefined;
    },
    // Meters above launch: barometer altitude, or else GPS altitude over the
    // launch point's.
    heightAboveHome(): number | undefined {
      const baro = this.altitude;
      if (baro) return baro.altitude;
      const telemetry = useTelemetryStore();
      const gps = telemetry.gps;
      const home = telemetry.gpsHome;
      if (!this.position || !this.home || !gps || !home) return undefined;
      return gps.altitude - home.altitude;
    },
    // The launch point, latched by the flight controller while armed.
    home(state): GeoPoint | undefined {
      const telemetry = useTelemetryStore();
      const home = telemetry.gpsHome;
      const at = telemetry.updatedAt[CrsfTelemetryType.GpsHome] ?? 0;
      if (!state.status?.armed || !home || state.now - at > HOME_STALE_MS)
        return undefined;
      return { lat: home.lat, lon: home.lon };
    },
    homeDistance(): number | undefined {
      const home = this.home;
      const position = this.position;
      return position && hasCoord(home) ? distance(position, home) : undefined;
    },
    targetDistance(): number | undefined {
      const target = this.status?.target;
      const position = this.position;
      return position && hasCoord(target)
        ? distance(position, target)
        : undefined;
    },
  },
  actions: {
    // Shares the socket with a configurator session on the same bridge; the
    // serial store connects it with every radio link session.
    async connect(key: string) {
      if (this.connected || this.connecting) return;
      this.connecting = true;
      const link = CrsfSocket.acquire(key);
      socket = link;
      unsubscribe = [
        link.on(CRSF_FRAMETYPE_QUIC_RT, (body) => this.receive(body)),
        // Standard telemetry arrives on the same bridge; the trail follows
        // its GPS frames.
        ...useTelemetryStore().listen(link),
        link.on(CrsfTelemetryType.Gps, () => this.track()),
        link.onClose((e) => {
          Log.warn("nav", "link closed", e);
          this.disconnect();
        }),
      ];
      try {
        await link.open();
      } catch (err) {
        this.disconnect();
        throw err;
      } finally {
        this.connecting = false;
      }
      this.connected = true;
      lastPing = 0;
      timer = setInterval(() => this.tick(), TICK_MS);
      this.tick();
    },
    disconnect() {
      clearInterval(timer);
      timer = undefined;
      for (const fn of unsubscribe) fn();
      unsubscribe = [];
      socket?.release();
      socket = undefined;
      this.finish(NavResult.None, false);
      this.connected = false;
      this.status = undefined;
      useTelemetryStore().$reset();
    },
    clearTrail() {
      this.trail = [];
    },
    // Resolves with the flight controller's answer, or NavResult.None when
    // no acknowledgement arrives. A newer command replaces a pending one.
    send(
      cmd: NavCommandRequest,
      label: string,
      record = true,
    ): Promise<NavResult> {
      if (!socket) return Promise.resolve(NavResult.None);
      this.finish(NavResult.None, false);
      // The firmware acknowledges a repeated id without applying it again,
      // so never reuse the id it last acknowledged. Ids run 1..255.
      let id = this.nextId;
      if (id == this.status?.commandId) id = (id % 255) + 1;
      this.nextId = (id % 255) + 1;

      const now = Date.now();
      this.pending = {
        id,
        label,
        record,
        frame: frame(encodeCommand(cmd, id)),
        startedAt: now,
        sentAt: now,
      };
      socket.send(this.pending.frame);
      return new Promise((resolve) => (settle = resolve));
    },
    // Settles the pending command; record shows its result to the user.
    finish(result: NavResult, record = true) {
      if (this.pending && record && this.pending.record) {
        this.record(this.pending.label, result);
      }
      this.pending = undefined;
      settle?.(result);
      settle = undefined;
    },
    record(label: string, result: NavResult) {
      this.log.unshift({ label, result, at: Date.now() });
      if (this.log.length > LOG_MAX) this.log.pop();
    },
    // Replaces the stored mission, also in flight. Only waypoints that differ
    // from base are sent when the flight controller still stores base.
    async uploadMission(mission: Mission, base?: Mission): Promise<NavResult> {
      const stored =
        base &&
        this.status?.missionCount == base.waypoints.length &&
        this.status.missionCrc == missionCrc(base);
      this.uploading = true;
      try {
        let result = await this.sendMission(mission, stored ? base : undefined);
        // Staging starts from what the flight controller stores, not base.
        if (result == NavResult.Mismatch && stored) {
          result = await this.sendMission(mission);
        }
        this.record("Upload mission", result);
        return result;
      } finally {
        this.uploading = false;
      }
    },
    async sendMission(mission: Mission, base?: Mission): Promise<NavResult> {
      const waypoints = mission.waypoints;
      const changed = [...waypoints.keys()].filter(
        (i) =>
          !base?.waypoints[i] ||
          !sameMissionItem(waypoints[i], base.waypoints[i]),
      );
      for (let n = 0; n < changed.length; ) {
        const index = changed[n];
        const items = waypoints.slice(index, index + NAV_MISSION_ITEMS_MAX);
        const result = await this.send(
          { type: NavCommand.MissionItems, index, waypoints: items },
          `Upload waypoint ${index + 1}/${waypoints.length}`,
          false,
        );
        if (result != NavResult.Ok) return result;
        while (n < changed.length && changed[n] < index + items.length) n++;
      }
      return this.send(
        {
          type: NavCommand.MissionCommit,
          count: waypoints.length,
          endAction: mission.end_action,
          crc: missionCrc(mission),
        },
        "Commit mission",
        false,
      );
    },
    tick() {
      const now = Date.now();
      this.now = now;
      const pending = this.pending;
      if (pending) {
        if (now - pending.startedAt > COMMAND_TIMEOUT_MS) {
          this.finish(NavResult.None);
        } else if (now - pending.sentAt > RESEND_MS) {
          pending.sentAt = now;
          socket?.send(pending.frame);
        }
      }
      // Commands also keep the link alive; ping only when idle.
      if (!this.pending && now - lastPing > PING_MS) {
        lastPing = now;
        socket?.send(frame(encodePing()));
      }
    },
    receive(body: Uint8Array) {
      // body: <type> <dest> <origin> <payload...>
      if (
        body[1] != CRSF_ADDRESS_CONFIGURATOR ||
        body[2] != CRSF_ADDRESS_FLIGHT_CONTROLLER
      ) {
        return;
      }
      const status = decodeStatus(body.subarray(3));
      if (!status) return;

      this.status = status;
      this.updatedAt = this.now = Date.now();
      if (
        this.pending?.id == status.commandId &&
        status.commandResult != NavResult.None
      ) {
        this.finish(status.commandResult);
      }
    },
    track() {
      this.now = Date.now();
      const position = this.position;
      const last = this.trail[this.trail.length - 1];
      if (position && (!last || distance(last, position) >= TRAIL_MIN_STEP)) {
        this.trail.push(position);
        if (this.trail.length > TRAIL_MAX) this.trail.shift();
      }
    },
  },
});
