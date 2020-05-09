import { post, get_stream } from "@/store/api.js";


const store = {
  state: {
    cpu_load: 0.0,
    vbat_filter: 0.0,
    rx_filter: [],
    gyro_vector: null,
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
    set_blackbox_rate(ctx, rate) {
      return post("/api/blackbox/rate", rate)
    },
  }
}

export default store;