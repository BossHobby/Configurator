
const store = {
  state: {
    cpu_load: 0.0,
    vbattfilt: 0.0,
    rx_filtered: [],
    GEstG: null,
    aux: [],
  },
  getters: {},
  mutations: {
    set_state(state, update) {
      for (const key in update) {
        state[key] = update[key];
      }
    },
  },
  actions: {}
}

export default store;