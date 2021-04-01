import { post, get } from '@/store/api.js';


const store = {
  state: {
    loading: false,
    test: null,
    settings: null,
  },
  getters: {},
  mutations: {
    set_loading(state, loading) {
      state.loading = loading
    },
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
      return get('/api/motor/test')
        .then(motor_test => {
          commit('set_motor_test', motor_test);
        })
    },
    fetch_motor_settings({ commit }) {
      commit('set_loading', true);
      return get('/api/motor/settings')
        .then(settings => {
          commit('set_motor_settings', settings);
        })
        .catch(err => {
          commit('append_alert', { type: 'danger', msg: 'Loading motor settings failed!' });
          console.error(err);
        })
        .finally(() => {
          commit('set_loading', false);
        })
    },
    apply_motor_settings({ commit }, settings) {
      commit('set_loading', true);
      return post('/api/motor/settings', settings)
        .then(() => {
          commit('set_motor_settings', settings);
        })
        .catch(err => {
          commit('append_alert', { type: 'danger', msg: 'Failed to apply motor settings!' });
          console.error(err);
        })
        .finally(() => {
          commit('append_alert', { type: 'success', msg: 'Motor settings applied!' });
          commit('set_loading', false);
        })
    },
    motor_test_toggle({ commit, state }) {
      var url = '/api/motor/test/enable'
      if (state.test.active) {
        url = '/api/motor/test/disable'
      }
      return post(url, {}).then(() => {
        commit('set_motor_test_active', state.test.active ? 0 : 1);
      })
    },
    motor_test_set_value({ commit }, value) {
      return post('/api/motor/test/value', value).then(() => {
        commit('set_motor_test_value', value);
      })
    },
  }
}

export default store;