import { QuicVal } from '../serial/quic';
import { serial } from '../serial/serial';

const store = {
  state: {
    looptime_autodetect: 0,
    cpu_load: 0.0,
    vbattfilt: 0.0,
    rx_filtered: [],
    rx_status: 0,
    rx_rssi: 0,
    GEstG: null,
    aux: [],
  },
  getters: {},
  mutations: {
    set_state(state, update) {
      for (const key in update) {
        state[key] = update[key];
      }
    },
  },
  actions: {
    fetch_state({ commit }) {
      return serial
        .get(QuicVal.State)
        .then(s => commit('set_state', s));
    }
  }
}

export default store;