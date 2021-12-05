import { serial } from '../serial/serial';
import router from '../../router';
import { Log } from '@/log';

var interval = null;
var intervalCounter = 0;

const store = {
  state: {
    is_connected: false,
    is_connecting: false,
  },
  getters: {

  },
  mutations: {
    set_connecting(state, connecting) {
      state.is_connecting = connecting;
    },
    set_connected(state, connected) {
      state.is_connected = connected;
    },
  },
  actions: {
    poll_serial({ dispatch, state }) {
      intervalCounter++;
      if (!state.is_connected) {
        return;
      }

      dispatch('fetch_state');
      if (intervalCounter % 4 && router.currentRoute.fullPath == "/receiver") {
        dispatch('fetch_bind_info');
      }
    },
    soft_reboot() {
      return serial
        .softReboot();
    },
    hard_reboot({ commit }) {
      return serial
        .hardReboot()
        .then(() => {
          commit('append_alert', { type: "success", msg: "Reset to bootloader successful!" });
        })
        .catch((err) => {
          Log.error("serial", err);
          commit('append_alert', { type: "danger", msg: "Reset to bootloader failed" });
        });
    },
    toggle_connection({ state, commit, dispatch }) {
      if (state.is_connected) {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }

        commit('set_connected', false);
        commit('set_connecting', false);

        if (router.currentRoute.fullPath != "/home") {
          router.push("/home")
        }

        return serial.close();
      }

      commit('set_connecting', true)

      return serial
        .connect((err) => {
          Log.error("serial", err)
  
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
  
          commit('set_connected', false);
          commit('set_connecting', false);
  
          if (router.currentRoute.fullPath != "/home") {
            router.push("/home")
          }
        })
        .then((info) => {
          commit('set_connected', true);
          commit('set_info', info);

          dispatch('fetch_default_profile');
          dispatch('fetch_pid_rate_presets');
          dispatch('fetch_profile');

          if (interval) {
            clearInterval(interval);
          }
          interval = setInterval(() => dispatch('poll_serial'), 250);

          if (router.currentRoute.fullPath != "/profile") {
            router.push("/profile")
          }
        })
        .catch((err) => {
          Log.error("serial", err);
          commit('set_connected', false);
          commit('append_alert', { type: "danger", msg: 'Connection to the board failed' });
        })
        .finally(() => {
          commit('set_connecting', false);
        })

    },
  }
}

export default store;