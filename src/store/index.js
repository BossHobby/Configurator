import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

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
import { serial } from './serial/serial';
import { QuicCmd, QuicVal } from './serial/quic';

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
  },
  state: {
    log: [],
    alerts: [],

    firmware_releases: [],
    flash: {},

    pid_rate_presets: [],
  },
  mutations: {
    set_default_profile(state, default_profile) {
      state.default_profile = default_profile
    },
    set_pid_rate_presets(state, pid_rate_presets) {
      state.pid_rate_presets = pid_rate_presets
    },
    set_firmware_releases(state, firmware_releases) {
      state.firmware_releases = firmware_releases
    },
    set_flash(state, flash) {
      state.flash = flash
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
    fetch_firmware_releases() {
      //return get("/api/flash/releases")
      //  .then(p => commit('set_firmware_releases', p))
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