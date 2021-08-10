import { get } from "@/store/api.js";


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
      return get("/api/bind/info")
        .then(p => commit('set_bind_info', p))
    }
  }
}

export default store;