import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

import { get, post } from "@/api.js";
import profileModule from "./profile";

var ws = null

function sendWebsocket(channel, payload) {
  if (ws == null || !ws.readyState) {
    return;
  }

  const data = JSON.stringify({
    Channel: channel,
    Payload: payload,
  })
  return ws.send(data)
}

const store = new Vuex.Store({
  modules: {
    profile: profileModule,
  },
  state: {
    status: {
      is_connected: false,
    },
    log: [],
    alerts: [],
    blackbox: {
      vbat_filter: 0.0,
    },
    pid_rate_presets: []
  },
  mutations: {
    set_status(state, status) {
      if (!status.Port || status.Port == "") {
        status.Port = status.AvailablePorts[0]
      }
      state.status = status
    },
    set_default_profile(state, default_profile) {
      state.default_profile = default_profile
    },
    set_pid_rate_presets(state, pid_rate_presets) {
      state.pid_rate_presets = pid_rate_presets
    },
    set_blackbox(state, blackbox) {
      state.blackbox = blackbox
    },
    append_log(state, line) {
      state.log = [...state.log, line]
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
              dispatch('fetch_profile')
              dispatch('fetch_pid_rate_preset')
            }
            commit('set_status', msg.Payload);
            break;
          case "blackbox":
            commit('set_blackbox', msg.Payload);
            break;
        }
      };
    },
    toggle_connection({ state }, port) {
      var path = "/api/connect"
      if (state.status.IsConnected) {
        path = "/api/disconnect";
      }
      return post(path, port)
    },
    fetch_pid_rate_preset({ commit }) {
      return get("/api/pid_rate_presets")
        .then(p => commit('set_pid_rate_presets', p))
    },
    cal_imu() {
      return post("/api/cal_imu", null)
    },
    set_blackbox_rate(ctx, rate) {
      return post("/api/blackbox/rate", rate)
    }
  }
})
export default store;