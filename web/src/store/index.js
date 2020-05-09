import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

import { get, post } from "@/store/api.js";
import router from '../router';

import profileModule from "./profile";
import statusModule from "./status";
import blackboxModule from "./blackbox";
import motorModule from "./motor";

var ws = null

const store = new Vuex.Store({
  modules: {
    profile: profileModule,
    status: statusModule,
    blackbox: blackboxModule,
    motor: motorModule,
  },
  state: {
    return_url: null,
    blackbox_pause: false,
    log: [],
    alerts: [],
    pid_rate_presets: [],
    vtx_settings: {
      channel: 0,
      band: 0,
    },
    default_profile: {
      serial: {
        port_max: 0,
      }
    },
    firmware_releases: [],
    flash: {}
  },
  mutations: {
    set_default_profile(state, default_profile) {
      state.default_profile = default_profile
    },
    set_pid_rate_presets(state, pid_rate_presets) {
      state.pid_rate_presets = pid_rate_presets
    },
    set_vtx_settings(state, vtx_settings) {
      state.vtx_settings = vtx_settings
    },
    set_firmware_releases(state, firmware_releases) {
      state.firmware_releases = firmware_releases
    },
    set_blackbox_pause(state, pause) {
      state.blackbox_pause = pause
    },
    set_flash(state, flash) {
      state.flash = flash
    },
    clear_log(state) {
      state.log = []
    },
    append_log(state, line) {
      if (state.log.length < 500) {
        state.log = [...state.log, line]
      } else {
        state.log = [line]
      }
    },
    append_alert(state, line) {
      state.alerts = [...state.alerts, line]
    }
  },
  actions: {
    connect_websocket({ commit, dispatch, state }) {
      ws = new WebSocket("ws://localhost:8000/api/ws");
      ws.onopen = function (evt) {
        console.log(evt)
      };
      ws.onclose = function () {
        ws = null
        setTimeout(() => dispatch("connect_websocket"), 1000);
      };
      ws.onmessage = function (evt) {
        const msg = JSON.parse(evt.data);
        switch (msg.Channel) {
          case "log":
            console.log(`<< ws ${msg.Channel}`, msg.Payload);
            commit('append_log', msg.Payload);
            break;
          case "status":
            console.log(`<< ws ${msg.Channel}`, msg.Payload);
            if (msg.Payload.IsConnected && !state.status.IsConnected) {
              commit('clear_log')
              dispatch('fetch_profile')
              dispatch('fetch_pid_rate_presets')
              router.push(state.return_url || "/profile")
            } else if (!msg.Payload.IsConnected) {
              commit('clear_log')
              commit('set_motor_settings', null);
              if (router.currentRoute.fullPath != "/home") {
                state.return_url = router.currentRoute.fullPath
              }
              router.push("/home")
            }
            commit('set_status', msg.Payload);
            break;
          case "blackbox":
            if (!state.blackbox_pause) {
              commit('set_blackbox', msg.Payload);
            }
            break;
          case "flash":
            console.log(`<< ws ${msg.Channel}`, msg.Payload);
            commit('set_flash', msg.Payload);
            break;
        }
      };
    },
    fetch_pid_rate_presets({ commit }) {
      return get("/api/pid_rate_presets")
        .then(p => commit('set_pid_rate_presets', p))
    },
    fetch_vtx_settings({ commit }) {
      return get("/api/vtx/settings")
        .then(p => commit('set_vtx_settings', p))
    },
    fetch_firmware_releases({ commit }) {
      return get("/api/flash/releases")
        .then(p => commit('set_firmware_releases', p))
    },
    apply_vtx_settings({ commit }, vtx_settings) {
      return post("/api/vtx/settings", vtx_settings)
        .then(p => commit('set_vtx_settings', p))
    },
    cal_imu() {
      return post("/api/cal_imu", null)
    },
    set_osd_font(ctx, name) {
      return post("/api/osd/font", name)
    }
  }
})
export default store;