import { useVTXStore } from "./vtx";
import { useProfileStore } from "./profile";
import { useDefaultProfileStore } from "./default_profile";
import { usePerfStore } from "./perf";
import { useBindStore } from "./bind";
import { Log } from "@/log";
import router from "@/router";
import { defineStore } from "pinia";
import { useRootStore } from "./root";
import { QuicCmd } from "./serial/quic";
import { serial } from "./serial/serial";
import { settings } from "./serial/settings";
import { useInfoStore } from "./info";
import { useMotorStore } from "./motor";
import { useStateStore } from "./state";
import { useBlackboxStore } from "./blackbox";
import { useTargetStore } from "./target";
import { asyncDelay } from "./util";
import { WebSerial } from "./serial/webserial";

let interval: any = null;
let intervalCounter = 0;

function stopInterval() {
  clearInterval(interval);
  interval = null;
  intervalCounter = 0;
}

function startInterval(fn: any) {
  stopInterval();

  interval = setInterval(async () => {
    await fn(intervalCounter);
    intervalCounter++;
  }, settings.serial.updateInterval);
}

export const useSerialStore = defineStore("serial", {
  state: () => ({
    is_connected: false,
    is_connecting: false,
  }),
  actions: {
    async poll_serial(counter: number) {
      if (!this.is_connected) {
        return;
      }

      const bind = useBindStore();
      const perf = usePerfStore();
      const state = useStateStore();
      const vtx = useVTXStore();

      await state.fetch_state();
      if (counter % 4) {
        if (router.currentRoute.value.fullPath == "/receiver") {
          await bind.fetch_bind_info();
        }
        if (router.currentRoute.value.fullPath == "/perf") {
          await perf.fetch_perf_counters();
        }
        if (router.currentRoute.value.fullPath == "/setup") {
          await vtx.update_vtx_settings();
        }
      }
    },
    async soft_reboot() {
      await this.disconnect();

      this.is_connecting = true;
      await serial.softReboot();
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
      const root = useRootStore();

      stopInterval();

      this.is_connected = false;
      this.is_connecting = false;
      root.reset_needs_reboot();

      if (router.currentRoute.value.fullPath != "/home") {
        router.push("/home");
      }
    },
    async connect(infoPromise: Promise<any>) {
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

        info.$reset();
        motor.$reset();
        vtx.$reset();
        bb.$reset();
        default_profile.$reset();
        profile.$reset();
        target.$reset();

        this.is_connected = true;
        info.set_info(i);

        if (info.quic_semver_gte("0.2.0")) {
          target.fetch();
        }

        default_profile.fetch_default_profile();
        root.fetch_pid_rate_presets();
        profile.fetch_profile();
        vtx.update_vtx_settings();

        startInterval((c) => this.poll_serial(c));

        if (router.currentRoute.value.fullPath != "/profile") {
          router.push("/profile");
        }
      } catch (err) {
        Log.error("serial", err);
        this.is_connected = false;
        root.reset_needs_reboot();
        root.append_alert({
          type: "danger",
          msg: "Connection to the board failed",
        });
      } finally {
        this.is_connecting = false;
      }
    },
    async toggle_connection() {
      if (this.is_connected) {
        this.disconnect();
        return serial.close();
      }

      this.is_connecting = true;
      return this.connect(
        serial.connect((err) => {
          Log.error("serial", err);
          this.disconnect();
          return serial.close();
        }),
      );
    },
  },
});
