
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
  }
}

export default store;