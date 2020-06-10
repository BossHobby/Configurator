import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

import { get, post } from "@/store/api.js";
import router from '../router';

import profileModule from "./profile";
import statusModule from "./status";
import blackboxModule from "./blackbox";
import stateModule from "./state";
import motorModule from "./motor";
import vtxModule from "./vtx";

var ws = null

const store = new Vuex.Store({
  modules: {
    profile: profileModule,
    status: statusModule,
    blackbox: blackboxModule,
    state: stateModule,
    motor: motorModule,
    vtx: vtxModule,
  },
  state: {
    log: [],
    alerts: [],

    firmware_releases: [],
    flash: {},

    pid_rate_presets: [],
    default_profile: {
      serial: {
        port_max: 0,
      }
    },
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
          case "status": {
            console.log(`<< ws ${msg.Channel}`, msg.Payload);

            const oldStatus = { ...state.status };
            commit('set_status', msg.Payload);

            if (msg.Payload.IsConnected && !oldStatus.IsConnected) {
              commit('clear_log')
              dispatch('fetch_profile')
              dispatch('fetch_pid_rate_presets')
              if (router.currentRoute.fullPath != "/profile") {
                router.push("/profile")
              }
            } else if (!msg.Payload.IsConnected && oldStatus.IsConnected) {
              commit('clear_log')
              commit('set_motor_settings', null);
              if (router.currentRoute.fullPath != "/home") {
                router.push("/home")
              }
            }

            break;
          }
          case "state":
            commit('set_state', msg.Payload);
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
    fetch_firmware_releases({ commit }) {
      return get("/api/flash/releases")
        .then(p => commit('set_firmware_releases', p))
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