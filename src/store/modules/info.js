import { post } from "@/store/api.js";

const store = {
  state: {
    usart_ports: [],
    motor_pins: [],
    quic_protocol_version: null,
    features: null,
  },
  getters: {
    has_feature(state) {
      return feature => {
        if (state.features == null) {
          return true;
        }
        return state.features & feature
      };
    }
  },
  mutations: {
    set_info(state, info) {
      for (const key in info) {
        state[key] = info[key];
      }
    },
  },
  actions: {
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
  }
}

export default store;