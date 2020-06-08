import { get_stream } from "@/store/api.js";


const store = {
  state: {
    cpu_load: 0.0,
    vbattfilt: 0.0,
    rx_filtered: [],
    GEstG: null,
  },
  getters: {},
  mutations: {
    set_blackbox(state, blackbox) {
      for (const key in blackbox) {
        state[key] = blackbox[key];
      }
    },
  },
  actions: {
    fetch_blackbox({ commit }) {
      commit('set_blackbox_pause', true)
      return get_stream("/api/blackbox", blackbox => {
        commit('set_blackbox', blackbox);
      })
    },
  }
}

export default store;