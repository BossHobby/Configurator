import { get, post } from "@/store/api.js";


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
      return get("/api/vtx/settings")
        .then(p => commit('set_vtx_settings', p))
    },
    apply_vtx_settings({ commit }, vtx_settings) {
      return post("/api/vtx/settings", vtx_settings)
        .then(p => commit('set_vtx_settings', p))
    },
  }
}

export default store;