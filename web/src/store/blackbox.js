import { get, post } from "@/store/api.js";


const store = {
  state: {
    busy: false,
    list: {}
  },
  getters: {},
  mutations: {
    set_blackbox_list(state, list) {
      state.list = list
    },
  },
  actions: {
    reset_blackbox({ commit }) {
      return post("/api/blackbox/reset", null)
        .then(() => {
          commit('append_alert', { type: "success", msg: "blackbox successfully reset" });
        })
        .catch(err => {
          commit('append_alert', { type: "danger", msg: err });
        })
    },
    list_blackbox({ commit }) {
      return get("/api/blackbox/list")
        .then(list => commit('set_blackbox_list', list))
    },
  }
}

export default store;