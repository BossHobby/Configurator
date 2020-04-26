import { post, get } from "@/store/api.js";


const store = {
  state: {
    active: 0,
    value: [0, 0, 0, 0]
  },
  getters: {},
  mutations: {
    set_motor_test(state, motor_test) {
      for (const key in motor_test) {
        state[key] = motor_test[key];
      }
    },
    set_motor_test_active(state, val) {
      state.active = val;
    },
    set_motor_test_value(state, val) {
      state.value = val;
    },
  },
  actions: {
    fetch_motor_test({ commit }) {
      return get("/api/motor_test").then(motor_test => {
        commit('set_motor_test', motor_test);
      })
    },
    motor_test_toggle({ commit, state }) {
      var url = "/api/motor_test/enable"
      if (state.active) {
        url = "/api/motor_test/disable"
      }
      return post(url, {}).then(() => {
        commit('set_motor_test_active', state.active ? 0 : 1);
      })
    },
    motor_test_set_value({ commit }, value) {
      return post("/api/motor_test/value", value).then(() => {
        commit('set_motor_test_value', value);
      })
    },
  }
}

export default store;