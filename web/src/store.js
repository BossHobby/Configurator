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
    vbat: {
      filter: 0.0,
      compare: 0.0
    },
    rx: {
      aux: [],
    },
    profile: {
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
    set_vbat(state, vbat) {
      state.vbat = vbat
    },
    set_rx(state, rx) {
      state.rx = rx
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
        console.log(`<< ws ${msg.Channel}`, msg.Payload);
        switch (msg.Channel) {
          case "status":
            if (msg.Payload.IsConnected && !state.status.IsConnected) {
              dispatch('fetch_profile')
            }
            commit('set_status', msg.Payload);
            break;
          case "vbat":
            commit('set_vbat', msg.Payload);
            break;
          case "rx":
            commit('set_rx', msg.Payload);
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
      return get("/api/profile")
        .then(p => commit('set_profile', p));
    },
    fetch_vbat() {
      return sendWebsocket("vbat")
    },
    fetch_rx() {
      return sendWebsocket("rx")
    },
    apply_profile({ commit }, profile) {
      return post("/api/profile", profile)
        .then(p => commit('set_profile', p));
    }
  }
})
export default store;