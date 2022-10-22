import { QuicVal } from "./serial/quic";
import { serial } from "./serial/serial";
import { Log } from "@/log";
import { FailloopMessages } from "./constants";
import { defineStore } from "pinia";

export const useStateStore = defineStore("state", {
  state: () => ({
    looptime_autodetect: 0,
    cpu_load: 0.0,
    cpu_temp: 0.0,
    vbat_filtered: 0.0,
    vbattfilt: null,
    ibat_filtered: 0.0,
    rx: [],
    rx_filtered: [],
    rx_status: 0,
    rx_rssi: 0,
    GEstG: null,
    accel: null,
    aux: [],
    stick_calibration_wizard: 0,
    failloop: 0,
    pidoutput: null,
    accel_raw: null,
    gyro: null,
    gyro_raw: null,
  }),
  getters: {
    vbat(state) {
      return state.vbattfilt || state.vbat_filtered;
    },
    failloopMessage(state) {
      return FailloopMessages[state.failloop];
    },
  },
  actions: {
    fetch_state() {
      return serial
        .get(QuicVal.State)
        .then((update) => this.$patch(update))
        .catch((err) => Log.warn("state", err));
    },
  },
});
