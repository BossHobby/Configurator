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
import { LinkSuspendedError, serial } from "./serial/serial";
import { settings } from "./serial/settings";
import { ScanCancelled } from "./serial/ble-scan";
import { watch } from "vue";
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
        await useStateStore().fetch_state();
        // Keep edits that were not applied before arming.
        if (!root.needs_apply) {
          await useProfileStore().fetch_profile();
        }
        const mission = useMissionStore();
        if (mission.supported && !mission.dirty) {
          await mission.fetch();
        }
        root.in_flight = false;
        startInterval((c) => this.poll_serial(c));
      } catch (err) {
        // Armed again before the session was back; stay in flight.
        if (useNavStore().status?.armed) return;
        Log.error("serial", err);
        await this.disconnect();
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
          return this.disconnect();
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
    reset_connection() {
      if (this.radio_link) useNavStore().disconnect();
      this.is_connected = false;
      this.is_connecting = false;
      this.radio_link = false;

      stopInterval();
      stopArmWatch?.();
      stopArmWatch = undefined;

      const root = useRootStore();
      root.in_flight = false;
      root.reset_needs_reboot();

      if (router.currentRoute.value.fullPath != "/home") {
        router.push("/home");
      }
    },
    async disconnect() {
      this.reset_connection();
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

        if (router.currentRoute.value.fullPath != "/profile") {
          router.push("/profile");
        }
      } catch (err) {
        Log.error("serial", err);
        this.is_connected = false;
        stopInterval();
        await serial.close();
        root.reset_needs_reboot();
        if (!(err instanceof ScanCancelled)) {
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

      this.is_connecting = true;
      return this.connect(
        serial.connect(useConnectionStore().target, (err) => {
          Log.error("serial", err);
          return this.disconnect();
        }),
      );
    },
  },
});
