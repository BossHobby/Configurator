import { serial } from '../serial/serial';
import { QuicVal } from '../serial/quic';


const store = {
  state: {
    info: {
      bind_saved: 0,
    }
  },
  getters: {},
  mutations: {
    set_bind_info(state, info) {
      state.info = info
    },
  },
  actions: {
    fetch_bind_info({ commit }) {
      return serial
        .get(QuicVal.BindInfo)
        .then(b => commit('set_bind_info', b))
    }
  }
}

export default store;