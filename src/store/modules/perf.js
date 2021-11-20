
const store = {
  state: {
    counters: [],
  },
  getters: {},
  mutations: {
    set_perf_counters(state, update) {
      state.counters = update;
    },
  },
  actions: {}
}

export default store;