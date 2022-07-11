import { defineStore } from "pinia";
import { serial } from "./serial/serial";
import { QuicCmd, QuicVal } from "./serial/quic";

const rebootNeededKeys = [
  "profile.serial.",
  "profile.receiver.protocol",
  "bind.info",
];

const applyNeededKeys = ["profile."];

export const useRootStore = defineStore("root", {
  state: () => ({
    needs_apply: false,
    needs_reboot: false,

    log: [] as any[],
    alerts: [] as any[],

    pid_rate_presets: [],
  }),
  actions: {
    append_log(line) {
      if (this.log.length < 500) {
        this.log = [...this.log, line];
      } else {
        this.log = [line];
      }
    },
    clear_log() {
      this.log = [];
    },

    append_alert(alert) {
      this.alerts = [
        ...this.alerts,
        {
          id: Date.now().toString() + "-" + this.alerts.length.toString(),
          ...alert,
        },
      ];
    },
    pop_alert(id) {
      this.alerts = [...this.alerts.filter((a) => a.id != id)];
    },

    track_key_change(path) {
      for (const key of applyNeededKeys) {
        if (path.startsWith(key)) {
          this.needs_apply = true;
          break;
        }
      }

      for (const key of rebootNeededKeys) {
        if (path.startsWith(key)) {
          this.needs_reboot = true;
          break;
        }
      }
    },

    reset_needs_apply() {
      this.needs_apply = false;
    },
    reset_needs_reboot() {
      this.needs_apply = false;
      this.needs_reboot = false;
    },

    fetch_pid_rate_presets() {
      return serial
        .get(QuicVal.PidRatePresets)
        .then((p) => (this.pid_rate_presets = p));
    },
    cal_imu() {
      return serial.command(QuicCmd.CalImu);
    },
    cal_sticks() {
      return serial.command(QuicCmd.CalSticks);
    },
  },
});
