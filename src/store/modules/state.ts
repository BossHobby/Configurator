import { QuicVal } from "../serial/quic";
import { serial } from "../serial/serial";
import { Log } from "@/log";
import Vue from "vue";

const store = {
  state: {
    looptime_autodetect: 0,
    cpu_load: 0.0,
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
  },
  getters: {
    vbat(state) {
      return state.vbattfilt || state.vbat_filtered;
    },
  },
  mutations: {
    set_state(state, update) {
      for (const key in update) {
        Vue.set(state, key, Object.freeze(update[key]));
      }
    },
  },
  actions: {
    fetch_state({ commit }) {
      return serial
        .get(QuicVal.State)
        .then((s) => commit("set_state", s))
        .catch((err) => Log.warn("state", err));
    },
  },
};

export default store;
