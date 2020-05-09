import { post, get } from "@/store/api.js";


const store = {
  state: {
    test: null,
    settings: null,
  },
  getters: {},
  mutations: {
    set_motor_test(state, motor_test) {
      state.test = motor_test;
    },
    set_motor_settings(state, settings) {
      state.settings = settings;
    },
    set_motor_test_active(state, val) {
      state.test.active = val;
    },
    set_motor_test_value(state, val) {
      state.test.value = val;
    },
  },
  actions: {
    fetch_motor_test({ commit }) {
      return get("/api/motor/test").then(motor_test => {
        commit('set_motor_test', motor_test);
      })
    },
    fetch_motor_settings({ commit }) {
      return get("/api/motor/settings").then(settings => {
        commit('set_motor_settings', settings);
      })
    },
    apply_motor_settings({ commit }, settings) {
      return post("/api/motor/settings", settings).then(() => {
        commit('set_motor_settings', settings);
      })
    },
    motor_test_toggle({ commit, state }) {
      var url = "/api/motor/test/enable"
      if (state.test.active) {
        url = "/api/motor/test/disable"
      }
      return post(url, {}).then(() => {
        commit('set_motor_test_active', state.test.active ? 0 : 1);
      })
    },
    motor_test_set_value({ commit }, value) {
      return post("/api/motor/test/value", value).then(() => {
        commit('set_motor_test_value', value);
      })
    },
  }
}

export default store;