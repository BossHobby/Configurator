import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

import { serial } from './serial/serial';
import { QuicCmd, QuicVal } from './serial/quic';

import profileModule from "./modules/profile";
import defaultProfileModule from "./modules/default_profile";
import infoModule from "./modules/info";
import perfModule from "./modules/perf";
import blackboxModule from "./modules/blackbox";
import stateModule from "./modules/state";
import motorModule from "./modules/motor";
import vtxModule from "./modules/vtx";
import bindModule from "./modules/bind";
import serialModule from "./modules/serial";
import flashModule from "./modules/flash";

const store = new Vuex.Store({
  modules: {
    profile: profileModule,
    default_profile: defaultProfileModule,
    info: infoModule,
    blackbox: blackboxModule,
    state: stateModule,
    motor: motorModule,
    vtx: vtxModule,
    perf: perfModule,
    bind: bindModule,
    serial: serialModule,
    flash: flashModule,
  },
  state: {
    log: [],
    alerts: [],

    pid_rate_presets: [],
  },
  mutations: {
    set_default_profile(state, default_profile) {
      state.default_profile = default_profile
    },
    set_pid_rate_presets(state, pid_rate_presets) {
      state.pid_rate_presets = pid_rate_presets
    },

    append_log(state, line) {
      if (state.log.length < 500) {
        state.log = [...state.log, line]
      } else {
        state.log = [line]
      }
    },
    clear_log(state) {
      state.log = []
    },

    append_alert(state, alert) {
      state.alerts = [...state.alerts, alert]
    }
  },
  actions: {
    fetch_pid_rate_presets({ commit }) {
      return serial
        .get(QuicVal.PidRatePresets)
        .then(p => commit('set_pid_rate_presets', p))
    },
    cal_imu() {
      return serial.command(QuicCmd.CalImu);
    },
    set_osd_font() {
      // return post("/api/osd/font", name)
    },
    update() {

    },
  }
});

export default store;