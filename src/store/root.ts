import type { pid_rate_preset_t } from "./types";
import { defineStore } from "pinia";
import { serial } from "./serial/serial";
import { QuicCmd, QuicVal } from "./serial/quic";

export const useRootStore = defineStore("root", {
  state: () => ({
    needs_apply: false,
    needs_reboot: false,

    alerts: [] as any[],

    // A long-running exchange with the board, shown with its progress.
    activity: null as {
      label: string;
      progress: number;
      // Sent, but the board has not started replying yet.
      waiting: boolean;
    } | null,

    pid_rate_presets: [] as pid_rate_preset_t[],
  }),
  actions: {
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

    /**
     * Shows the progress of the commands fn sends, expecting about steps of
     * them. Nested calls count towards the outer one.
     */
    async track<T>(label: string, steps: number, fn: () => Promise<T>) {
      if (this.activity) return fn();
      const activity = { label, progress: 0, waiting: false };
      this.activity = activity;
      try {
        return await serial.track(
          steps,
          (progress, waiting) => {
            if (!this.activity) return;
            // Commands sent alongside, such as polls, must not move it back.
            this.activity.progress = Math.max(this.activity.progress, progress);
            this.activity.waiting = waiting;
          },
          fn,
        );
      } finally {
        this.activity = null;
      }
    },

    set_needs_apply() {
      this.needs_apply = true;
    },
    set_needs_reboot() {
      this.needs_apply = true;
      this.needs_reboot = true;
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
