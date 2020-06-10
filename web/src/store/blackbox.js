import { get, post } from "@/store/api.js";


const store = {
  state: {
    list: {}
  },
  getters: {},
  mutations: {
    set_blackbox_list(state, list) {
      state.list = list
    },
  },
  actions: {
    reset_blackbox() {
      return post("/api/blackbox/reset", null)
    },
    list_blackbox({ commit }) {
      return get("/api/blackbox/list")
        .then(list => commit('set_blackbox_list', list))
    },
  }
}

export default store;