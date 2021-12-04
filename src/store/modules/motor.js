import { QuicCmd, QuicMotor, QuicVal } from '../serial/quic';
import { serial } from '../serial/serial';
import { Log } from '@/log';

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
      return serial
        .command(QuicCmd.Motor, QuicMotor.TestStatus)
        .then(p => {
          commit('set_motor_test', p.payload[0]);
        })
    },
    fetch_motor_settings({ commit }) {
      commit('set_loading', true);
      return serial
        .get(QuicVal.BLHeliSettings)
        .then(settings => {
          commit('set_motor_settings', settings);
        })
        .catch(err => {
          commit('append_alert', { type: 'danger', msg: 'Loading motor settings failed!' });
          Log.error("motor", err);
        })
        .finally(() => {
          commit('set_loading', false);
        })
    },
    apply_motor_settings({ commit }, settings) {
      commit('set_loading', true);
      return serial
        .set(QuicVal.BLHeliSettings, settings)
        .then(() => {
          commit('set_motor_settings', settings);
        })
        .catch(err => {
          commit('append_alert', { type: 'danger', msg: 'Failed to apply motor settings!' });
          Log.error("motor", err);
        })
        .finally(() => {
          commit('append_alert', { type: 'success', msg: 'Motor settings applied!' });
          commit('set_loading', false);
        })
    },
    motor_test_toggle({ commit, state }) {
      return serial
        .command(QuicCmd.Motor, state.test.active ? QuicMotor.TestDisable : QuicMotor.TestEnable)
        .then(() => {
          commit('set_motor_test_active', state.test.active ? 0 : 1);
        })
    },
    motor_test_set_value({ commit }, value) {
      return serial
        .command(QuicCmd.Motor, QuicMotor.TestSetValue, value)
        .then(() => {
          commit('set_motor_test_value', value);
        });
    },
  }
}

export default store;