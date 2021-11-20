import { QuicVal } from '../serial/quic';
import { serial } from '../serial/serial';


const store = {
  state: {
    settings: {
      channel: 0,
      band: 0,
    }
  },
  getters: {},
  mutations: {
    set_vtx_settings(state, settings) {
      state.settings = settings
    },
  },
  actions: {
    fetch_vtx_settings({ commit }) {
      return serial
        .get(QuicVal.VtxSettings)
        .then(v => commit('set_vtx_settings', v))
    },
    apply_vtx_settings({ commit }, vtx_settings) {
      return serial
        .set(QuicVal.VtxSettings, vtx_settings)
        .then(v => commit('set_vtx_settings', v))
    },
  }
}

export default store;