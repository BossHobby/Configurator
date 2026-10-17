import { defineStore } from "pinia";
import type { CrsfSocket } from "./serial/crsf";
import {
  CrsfTelemetryType,
  decodeTelemetry,
  type CrsfAttitude,
  type CrsfBaroAltitude,
  type CrsfBattery,
  type CrsfGps,
  type CrsfGpsExtended,
  type CrsfLinkStatistics,
  type CrsfLinkStatisticsSide,
} from "./util/crsf-telemetry";

// Telemetry is sent in rotation; a frame older than this is shown as missing.
const STALE_MS = 3000;

// The latest standard CRSF telemetry from the bridge the QUIC_RT link uses.
// The link statistics come from the radio link itself, the rest from the
// flight controller. Values are latest-wins, from different frames.
export const useTelemetryStore = defineStore("telemetry", {
  state: () => ({
    gps: undefined as CrsfGps | undefined,
    gpsExtended: undefined as CrsfGpsExtended | undefined,
    verticalSpeed: undefined as number | undefined,
    battery: undefined as CrsfBattery | undefined,
    baroAltitude: undefined as CrsfBaroAltitude | undefined,
    airspeed: undefined as number | undefined, // m/s
    link: undefined as CrsfLinkStatistics | undefined,
    linkRx: undefined as CrsfLinkStatisticsSide | undefined,
    linkTx: undefined as CrsfLinkStatisticsSide | undefined,
    attitude: undefined as CrsfAttitude | undefined,
    flightMode: undefined as string | undefined,
    // Arrival time by frame type.
    updatedAt: {} as Record<number, number>,
  }),
  getters: {
    fresh:
      (state) =>
      (type: number, now = Date.now()): boolean =>
        now - (state.updatedAt[type] ?? 0) <= STALE_MS,
  },
  actions: {
    // Subscribes to every telemetry type on the socket; returns the
    // unsubscribers for the owner of the socket.
    listen(socket: CrsfSocket): (() => void)[] {
      return Object.values(CrsfTelemetryType).map((type) =>
        socket.on(type, (body) => this.receive(body)),
      );
    },
    receive(body: Uint8Array) {
      const frame = decodeTelemetry(body);
      if (!frame) return;
      const { type, ...values } = frame;
      this.$patch(values);
      this.updatedAt[type] = Date.now();
    },
  },
});
