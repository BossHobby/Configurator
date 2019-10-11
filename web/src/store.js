import Vue from 'vue'
import Vuex from 'vuex'

import { get, post } from "@/api.js";

Vue.use(Vuex)

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
  state: {
    status: {
      IsConnected: false,
    },
    log: [],
    alerts: [],

    blackbox: {
      VbatFilter: 0.0,
    },

    profile: {
      Meta: {},
      Motor: {
        InvertYaw: 1,
      },
      Rate: {
        Mode: 0,
        Silverware: {},
        Betaflight: {},
      },
      Voltage: {},
      Channel: {
        Aux: [],
      },
      PID: {
        PIDProfile: 0,
        PIDRates: [{}],
        StickProfile: 0,
        StickRates: [{}],
      }
    }
  },
  mutations: {
    set_status(state, status) {
      if (!status.Port || status.Port == "") {
        status.Port = status.AvailablePorts[0]
      }
      state.status = status
    },
    set_profile(state, profile) {
      state.profile = profile
    },
    set_default_profile(state, default_profile) {
      state.default_profile = default_profile
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
    fetch_profile({ commit }) {

      return get("/api/default_profile")
        .then(p => commit('set_default_profile', p))
        .then(() => get("/api/profile"))
        .then(p => commit('set_profile', p));
    },
    apply_profile({ commit }, profile) {
      profile.Meta.Datetime = Math.floor(Date.now() / 1000);
      return post("/api/profile", profile)
        .then(p => commit('set_profile', p))
        .then(() => commit('append_alert', "profile applied!"));
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