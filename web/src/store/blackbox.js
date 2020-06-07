import { post, get_stream, get } from "@/store/api.js";


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
    reset_blackbox() {
      return post("/api/blackbox/reset", null)
    },
    list_blackbox() {
      return get("/api/blackbox/list")
    },
  }
}

export default store;