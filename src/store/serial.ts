import { useVTXStore } from "./vtx";
import { useProfileStore } from "./profile";
import { useDefaultProfileStore } from "./default_profile";
import { usePerfStore } from "./perf";
import { useBindStore } from "./bind";
import { useGpsStore } from "./gps";
import { useMissionStore } from "./mission";
import { useNavStore } from "./nav";
import { Log } from "@/log";
import router from "@/router";
import { defineStore } from "pinia";
import { useRootStore } from "./root";
import { useConnectionStore } from "./connection";
import { QuicCmd, QuicMotor } from "./serial/quic";
import {
  LinkSuspendedError,
  crsfKey,
  serial,
  type ConnectionTarget,
} from "./serial/serial";
import { settings } from "./serial/settings";
import { ScanCancelled } from "./serial/ble-scan";
import { requestBleDevice } from "./serial/ble";
import { watch, type WatchStopHandle } from "vue";
import { useInfoStore } from "./info";
import { useMotorStore } from "./motor";
import { useStateStore } from "./state";
import { useBlackboxStore } from "./blackbox";
import { useTargetStore } from "./target";
import { asyncDelay } from "./util";
import { WebSerial } from "./serial/webserial";

let interval: any = null;
let intervalCounter = 0;
// Follows the armed flag of the QUIC_RT link during a radio link session.
let stopArmWatch: (() => void) | undefined;
// Waits for an armed craft, followed without a session, to disarm.
let stopFollowWatch: (() => void) | undefined;

/** The craft was armed when connecting; it is followed on the map. */
class CraftArmedError extends Error {}

function stopInterval() {
  clearInterval(interval);
  interval = null;
  intervalCounter = 0;
}

function startInterval(fn: any) {
  stopInterval();

  // The radio link carries roughly 1 kB/s, so poll far less often.
  const period = serial.isRadioLink ? 2000 : settings.serial.updateInterval;
  // Skip ticks while a slow link is still answering the previous poll.
  let polling = false;
  interval = setInterval(async () => {
    if (polling) return;
    polling = true;
    try {
      await fn(intervalCounter);
      intervalCounter++;
    } catch (err) {
      // Arming cut off this poll; polling resumes after disarming.
      if (!(err instanceof LinkSuspendedError)) throw err;
    } finally {
      polling = false;
    }
  }, period);
}

export const useSerialStore = defineStore("serial", {
  state: () => ({
    is_connected: false,
    is_connecting: false,
    // Connected over the CRSF radio link.
    radio_link: false,
  }),
  actions: {
    enter_flight() {
      stopInterval();
      useRootStore().in_flight = true;
      serial.suspend();
    },
    // Disarmed again: open a new session and refresh what may have changed.
    async leave_flight() {
      const root = useRootStore();
      this.is_connecting = true;
      try {
        const i = await serial.resume();
        useInfoStore().set_info(i);
        // Keep edits that were not applied before arming.
        const fetchProfile = !root.needs_apply;
        const mission = useMissionStore();
        const fetchMission = mission.supported && !mission.dirty;
        const steps = 1 + Number(fetchProfile) + Number(fetchMission);
        await root.track("Reloading configuration", steps, async () => {
          await useStateStore().fetch_state();
          if (fetchProfile) {
            await useProfileStore().fetch_profile();
          }
          if (fetchMission) {
            await mission.fetch();
          }
        });
        root.in_flight = false;
        startInterval((c) => this.poll_serial(c));
      } catch (err) {
        // Armed again before the session was back; stay in flight.
        if (useNavStore().status?.armed) return;
        Log.error("serial", err);
        await this.disconnect(false);
        root.append_alert({
          type: "danger",
          msg: "Reconnecting after disarming failed",
        });
      } finally {
        this.is_connecting = false;
      }
    },
    // Arming ends the radio link's session; the QUIC_RT link reports it.
    follow_arming(key: string) {
      const nav = useNavStore();
      const root = useRootStore();
      nav
        .connect(key)
        .catch((err) => Log.warn("serial", "QUIC_RT link failed", err));
      stopArmWatch?.();
      stopArmWatch = watch(
        () => nav.status?.armed,
        (armed) => {
          if (armed) this.enter_flight();
          else if (armed === false && root.in_flight) this.leave_flight();
        },
      );
    },
    async poll_serial(counter: number) {
      if (!this.is_connected) {
        return;
      }

      const bind = useBindStore();
      const info = useInfoStore();
      const perf = usePerfStore();
      const profile = useProfileStore();
      const state = useStateStore();
      const vtx = useVTXStore();

      await state.fetch_state();
      if (counter % 4) {
        if (
          router.currentRoute.value.fullPath == "/receiver" &&
          !info.quic_semver_gte("0.2.9")
        ) {
          await bind.fetch_bind_info();
        }
        if (router.currentRoute.value.fullPath == "/perf") {
          await perf.fetch_perf_counters();
        }
        if (router.currentRoute.value.fullPath == "/setup") {
          await vtx.update_status();
          if (profile.profileVersionGt("0.2.6") && profile.serial.gps != 0) {
            const gps = useGpsStore();
            await gps.poll_serial();
          }
        }
      }
    },
    async soft_reboot() {
      this.reset_connection();

      this.is_connecting = true;
      await serial.softReboot();
      // Over the radio link the session is retried until the board is back.
      for (let i = 0; !serial.isRadioLink && i < 10; i++) {
        const ports = await WebSerial.getPorts();
        if (!ports.length) {
          break;
        }
        await asyncDelay(100);
      }
      for (let i = 0; !serial.isRadioLink && i < 10; i++) {
        const ports = await WebSerial.getPorts();
        if (ports.length) {
          break;
        }
        await asyncDelay(100);
      }

      await this.connect(
        serial.reconnect((err) => {
          Log.error("serial", err);
          return this.disconnect(false);
        }),
      );
    },
    serial_passthrough({ port, baudrate, half_duplex, stop_bits }) {
      const root = useRootStore();

      return serial
        .command(
          QuicCmd.Serial,
          0,
          port,
          baudrate,
          half_duplex ? 1 : 0,
          stop_bits,
        )
        .then(() => this.disconnect())
        .then(() => {
          root.append_alert({
            type: "success",
            msg: "Serial passthrough successful!",
          });
        })
        .catch((err) => {
          Log.error("serial", err);
          root.append_alert({
            type: "danger",
            msg: "Serial passthrough failed",
          });
        });
    },
    esc_passthrough({ index, baudrate }) {
      const root = useRootStore();

      return serial
        .command(QuicCmd.Motor, QuicMotor.Serial, index, baudrate)
        .then(() => this.disconnect())
        .then(() => {
          root.append_alert({
            type: "success",
            msg: "ESC passthrough successful!",
          });
        })
        .catch((err) => {
          Log.error("serial", err);
          root.append_alert({
            type: "danger",
            msg: "ESC passthrough failed",
          });
        });
    },
    hard_reboot() {
      const root = useRootStore();

      return serial
        .hardReboot()
        .then((target) => {
          root.append_alert({
            type: "success",
            msg: "Reset to bootloader successful!",
          });
          return target;
        })
        .catch((err) => {
          Log.error("serial", err);
          root.append_alert({
            type: "danger",
            msg: "Reset to bootloader failed",
          });
          return undefined;
        });
    },
    /**
     * Ends the configurator session. A lost session keeps the QUIC_RT link
     * and the map, as the craft may be flying; only the user closes both.
     */
    reset_connection(closeLink = true) {
      const nav = useNavStore();
      if (this.radio_link && closeLink) nav.disconnect();
      this.is_connected = false;
      this.is_connecting = false;
      this.radio_link = false;

      stopInterval();
      stopArmWatch?.();
      stopArmWatch = undefined;
      stopFollowWatch?.();
      stopFollowWatch = undefined;

      const root = useRootStore();
      root.in_flight = false;
      root.reset_needs_reboot();

      const route = router.currentRoute.value;
      const keepMap =
        !closeLink &&
        nav.available &&
        (nav.connected || route.name === "mission");
      const to = keepMap ? "/mission" : "/home";
      if (route.fullPath != to) {
        router.push(to);
      }
    },
    async disconnect(closeLink = true) {
      this.reset_connection(closeLink);
      this.is_connecting = true;
      try {
        await serial.close();
      } finally {
        this.is_connecting = false;
      }
    },
    async connect(infoPromise: Promise<any>) {
      const bb = useBlackboxStore();
      const default_profile = useDefaultProfileStore();
      const info = useInfoStore();
      const mission = useMissionStore();
      const motor = useMotorStore();
      const profile = useProfileStore();
      const root = useRootStore();
      const state = useStateStore();
      const target = useTargetStore();
      const vtx = useVTXStore();

      try {
        const i = await infoPromise;

        info.$reset();
        mission.$reset();
        motor.$reset();
        vtx.$reset();
        bb.$reset();
        default_profile.$reset();
        profile.$reset();
        target.$reset();

        this.radio_link = serial.isRadioLink;
        info.set_info(i);

        const fetchTarget = info.quic_semver_gte("0.2.0");
        await root.track("Loading configuration", fetchTarget ? 5 : 4, () => {
          if (fetchTarget) {
            target.fetch();
          }
          return Promise.all([
            state.fetch_state(),
            default_profile.fetch_default_profile(),
            root.fetch_pid_rate_presets(),
            profile.fetch_profile(),
          ]);
        });
        vtx.update_status();

        // Navigation and pages need the profile, which takes a while over
        // the radio link.
        this.is_connected = true;
        startInterval((c) => this.poll_serial(c));
        const key = serial.radioKey;
        if (key) this.follow_arming(key);

        // Landing after following an armed craft keeps the map.
        const route = router.currentRoute.value;
        if (route.name != "mission" && route.fullPath != "/profile") {
          router.push("/profile");
        }
      } catch (err) {
        Log.error("serial", err);
        this.is_connected = false;
        stopInterval();
        await serial.close();
        root.reset_needs_reboot();
        if (err instanceof CraftArmedError) {
          root.append_alert({
            type: "warning",
            msg: "The craft is armed. Following it on the map; the configuration opens once it disarms.",
          });
        } else if (!(err instanceof ScanCancelled)) {
          root.append_alert({
            type: "danger",
            msg: "Connection to the board failed",
          });
        }
      } finally {
        this.is_connecting = false;
      }
    },
    async toggle_connection() {
      if (this.is_connecting) return;
      if (this.is_connected) {
        return this.disconnect();
      }
      return this.open_connection(true);
    },
    // pick lets the user choose the Bluetooth module, which needs a click.
    open_connection(pick: boolean) {
      this.is_connecting = true;
      const target = useConnectionStore().target;
      const key = crsfKey(target);
      const onError = (err: any) => {
        Log.error("serial", err);
        return this.disconnect(false);
      };
      return this.connect(
        key
          ? this.open_radio_session(target, key, pick, onError)
          : serial.connect(target, onError),
      );
    },
    /**
     * Opens the radio link's session with the QUIC_RT link beside it. An
     * armed craft ignores the session, so once the QUIC_RT link reports it
     * armed the craft is followed on the map instead.
     */
    async open_radio_session(
      target: ConnectionTarget,
      key: string,
      pick: boolean,
      onError: (err: any) => unknown,
    ) {
      if (pick && target.transport === "ble") await requestBleDevice();
      const nav = useNavStore();
      nav
        .connect(key)
        .catch((err) => Log.warn("serial", "QUIC_RT link failed", err));
      const session = serial.connect(target, onError);

      let stop: WatchStopHandle | undefined;
      const armed = new Promise<typeof CraftArmedError>((resolve) => {
        stop = watch(
          () => nav.armed,
          (armed) => armed && resolve(CraftArmedError),
          { immediate: true },
        );
      });
      try {
        const info = await Promise.race([session, armed]);
        if (info !== CraftArmedError) return info;
      } catch (err) {
        if (!nav.armed) {
          nav.disconnect();
          throw err;
        }
      } finally {
        stop?.();
      }
      // The ignored session times out on its own; connect() closes it.
      session.catch(() => undefined);
      this.follow_armed();
      throw new CraftArmedError();
    },
    // Opens the session once the followed craft disarms.
    follow_armed() {
      const nav = useNavStore();
      stopFollowWatch?.();
      const stop = watch(
        () => [nav.connected, nav.armed, !!nav.status] as const,
        ([connected, armed, status]) => {
          if (connected && (armed || !status)) return;
          stop();
          if (stopFollowWatch == stop) stopFollowWatch = undefined;
          // A lost link leaves the map showing it offline.
          if (connected && !this.is_connecting) this.open_connection(false);
        },
      );
      stopFollowWatch = stop;
      if (router.currentRoute.value.name != "mission") router.push("/mission");
    },
  },
});
