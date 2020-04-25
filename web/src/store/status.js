import { post } from "@/store/api.js";


const store = {
  state: {
    Info: {
      usart_ports: [],
      motor_pins: []
    },
    AvailablePorts: [],
    IsConnected: false,
  },
  getters: {
    can_connect: (state) => {
      return state.Port && state.Port.length > 0;
    },
  },
  mutations: {
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
    toggle_connection({ state }, port) {
      var path = "/api/connect"
      if (state.IsConnected) {
        path = "/api/disconnect";
      }
      return post(path, port)
    },
    soft_reboot() {
      return post("/api/soft_reboot", {})
    },
    connect_flash() {
      return post("/api/flash/connect", {})
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
          commit('append_alert', "update succeeded, restart to apply");
        })
        .catch(err => {
          commit('append_alert', err);
        })
    },
  }
}

export default store;