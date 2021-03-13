import { post } from "@/store/api.js";

const store = {
  state: {
    Info: {
      usart_ports: [],
      motor_pins: [],
      features: null,
    },
    AvailablePorts: [],
    IsConnected: false,
    IsConnecting: false,
    Port: null,
    BetaflightTarget: null
  },
  getters: {
    can_connect(state) {
      if (state.IsConnecting) {
        return false;
      }
      return state.Port && state.Port.length > 0;
    },
    has_feature(state) {
      return feature => {
        if (state.Info.features == null) {
          return true;
        }
        return state.Info.features & feature
      };
    }
  },
  mutations: {
    set_betaflight_target(state, target) {
      state.BetaflightTarget = target;
    },
    set_connecting(state, connecting) {
      state.IsConnecting = connecting;
    },
    set_status(state, status) {
      if (!status.Port || status.Port == "") {
        status.Port = status.AvailablePorts[0]
      }
      for (const key in status) {
        state[key] = status[key];
      }
    },
  },
  actions: {
    toggle_connection({ state, commit }, port) {
      const connecting = !state.IsConnected;
      var path = "/api/connect"
      if (state.IsConnected) {
        path = "/api/disconnect";
      } else {
        commit('set_connecting', true);
      }
      return post(path, port)
        .then((res) => {
          if (res == "OK") {
            commit('set_betaflight_target', null);
            return;
          }
          if (res.Type == "Betaflight") {
            commit('set_betaflight_target', res.Target);
          } else {
            commit('set_betaflight_target', null);
          }
        })
        .catch(err => {
          if (connecting) {
            commit('append_alert', { type: "danger", msg: 'Connection to the board failed' });
          }
          throw err
        })
        .finally(() => {
          commit('set_connecting', false);
        })
    },
    soft_reboot() {
      return post("/api/soft_reboot", {})
    },
    connect_flash({ commit }) {
      return post("/api/flash/connect", {})
        .then(() => commit('set_betaflight_target', null))
    },
    hard_reboot_first_port() {
      return post("/api/hard_reboot", {})
        .then(() => {
          setTimeout(() => post("/api/flash/connect", {}), 1000)
        })
    },
    update({ commit }) {
      return post("/api/update", {})
        .then(() => {
          commit('append_alert', { type: "success", msg: "update succeeded, restart to apply" });
        })
        .catch(err => {
          commit('append_alert', { type: "danger", msg: err });
        })
    },
  }
}

export default store;