import { useVTXStore } from "./vtx";
import { useProfileStore } from "./profile";
import { useDefaultProfileStore } from "./default_profile";
import { usePerfStore } from "./perf";
import { useBindStore } from "./bind";
import { useGpsStore } from "./gps";
import { Log } from "@/log";
import router from "@/router";
import { defineStore } from "pinia";
import { useRootStore } from "./root";
import { QuicCmd, QuicMotor } from "./serial/quic";
import { serial } from "./serial/serial";
import { settings } from "./serial/settings";
import { useInfoStore } from "./info";
import { useMotorStore } from "./motor";
import { useStateStore } from "./state";
import { useBlackboxStore } from "./blackbox";
import { useTargetStore } from "./target";
import { asyncDelay } from "./util";
import { WebSerial } from "./serial/webserial";
import { initialConnection } from "./serial/connection";
import { ScanCancelled } from "./serial/ble-scan";

let interval: any = null;
let intervalCounter = 0;
let connectionRevision = 0;

function stopInterval() {
  clearInterval(interval);
  interval = null;
  intervalCounter = 0;
}

function startInterval(fn: any) {
  stopInterval();

  // Skip ticks while a slow link is still answering the previous poll.
  let polling = false;
  interval = setInterval(async () => {
    if (polling) return;
    polling = true;
    try {
      await fn(intervalCounter);
      intervalCounter++;
    } catch (error) {
      Log.error("serial", error);
    } finally {
      polling = false;
    }
  }, serial.pollInterval);
}

export const useSerialStore = defineStore("serial", {
  state: () => ({
    connection: initialConnection(),
    is_connected: false,
    is_connecting: false,
    /** 0–1 through the connect stages, with a label for the current one. */
    connect_progress: 0,
    connect_status: "",
  }),
  actions: {
    set_progress(progress: number, status: string) {
      this.connect_progress = progress;
      this.connect_status = status;
    },
    begin_progress() {
      this.set_progress(0.05, "Connecting to device…");
      serial.onLinkReady = () => this.set_progress(0.35, "Reading board info…");
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
      await this.disconnect();

      this.is_connecting = true;
      const revision = connectionRevision;
      await serial.softReboot();
      if (serial.connectionKind === "usb") {
        for (let i = 0; i < 10; i++) {
          const ports = await WebSerial.getPorts();
          if (!ports.length) {
            break;
          }
          await asyncDelay(100);
        }
        for (let i = 0; i < 10; i++) {
          const ports = await WebSerial.getPorts();
          if (ports.length) {
            break;
          }
          await asyncDelay(100);
        }
      } else {
        await asyncDelay(1500);
      }

      if (revision !== connectionRevision) {
        this.is_connecting = false;
        return;
      }
      this.begin_progress();
      await this.connect(
        serial.connectFirstPort((err) => {
          Log.error("serial", err);
          this.disconnect();
          return serial.close();
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
        .then(() => serial.close())
        .then(() => this.toggle_connection())
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
        .then(() => serial.close())
        .then(() => this.toggle_connection())
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
    disconnect() {
      ++connectionRevision;
      this.is_connected = false;

      stopInterval();

      const root = useRootStore();
      root.reset_needs_reboot();

      if (router.currentRoute.value.fullPath != "/home") {
        router.push("/home");
      }
    },
    async connect(infoPromise: Promise<any>) {
      const revision = connectionRevision;
      const bb = useBlackboxStore();
      const default_profile = useDefaultProfileStore();
      const info = useInfoStore();
      const motor = useMotorStore();
      const profile = useProfileStore();
      const root = useRootStore();
      const target = useTargetStore();
      const vtx = useVTXStore();

      try {
        const i = await infoPromise;
        if (revision !== connectionRevision)
          throw new Error("Connection cancelled");

        info.$reset();
        motor.$reset();
        vtx.$reset();
        bb.$reset();
        default_profile.$reset();
        profile.$reset();
        target.$reset();

        this.is_connected = true;
        info.set_info(i);
        this.set_progress(0.5, "Loading configuration…");
        let loaded = 0;
        const step = <T>(p: Promise<T>) =>
          p.then((value) => {
            this.set_progress(
              0.5 + (0.5 * ++loaded) / 3,
              "Loading configuration…",
            );
            return value;
          });

        if (info.quic_semver_gte("0.2.0")) {
          target.fetch();
        }

        await Promise.all([
          step(default_profile.fetch_default_profile()),
          step(root.fetch_pid_rate_presets()),
          step(profile.fetch_profile()),
        ]);
        if (revision !== connectionRevision)
          throw new Error("Connection cancelled");
        vtx.update_status();

        startInterval((c) => this.poll_serial(c));

        if (router.currentRoute.value.fullPath != "/profile") {
          router.push("/profile");
        }
      } catch (err) {
        Log.error("serial", err);
        this.is_connected = false;
        stopInterval();
        await serial.close();
        root.reset_needs_reboot();
        if (!(err instanceof ScanCancelled))
          root.append_alert({
            type: "danger",
            msg:
              "Connection to the board failed: " +
              (err instanceof Error ? err.message : String(err)),
          });
      } finally {
        this.is_connecting = false;
        this.set_progress(0, "");
      }
    },
    async toggle_connection() {
      if (this.is_connecting) return;
      if (this.is_connected) {
        this.disconnect();
        return serial.close();
      }

      this.is_connecting = true;
      this.begin_progress();
      return this.connect(
        serial.connect((err) => {
          Log.error("serial", err);
          this.disconnect();
          return serial.close();
        }, this.connection),
      );
    },
  },
});
