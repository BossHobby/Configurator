import { serial } from '../serial/serial';
import router from '../../router';

var interval = null;
var intervalCounter = 0;

const store = {
  state: {
    is_connected: false,
    is_connecting: false,

    available: [],
  },
  getters: {

  },
  mutations: {
    add_available_serial_port(state, port) {
      const info = port.getInfo()
      const p = {
        ...info,
        name: `${info.usbVendorId}:${info.usbProductId}`,
      }
      state.available = [...state.available, p];
    },
    remove_available_serial_port(state, port) {
      const info = port.getInfo()
      const name = `${info.usbVendorId}:${info.usbProductId}`;
      state.available = [...state.available].filter(o => name != o.name);
    },
    set_connecting(state, connecting) {
      state.is_connecting = connecting;
    },
    set_connected(state, connected) {
      state.is_connected = connected;
    },
  },
  actions: {
    scan_serial_ports({ commit }) {
      serial.onError((err) => {
        console.error(err)

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

      navigator.serial.addEventListener('connect', (e) => {
        console.log('serial connect', e)
        commit('add_available_serial_port', e.target);
      });

      navigator.serial.addEventListener('disconnect', (e) => {
        console.log('serial disconnect', e)
        commit('remove_available_serial_port', e.target);
      });

      return navigator
        .serial
        .getPorts()
        .then((ports) => {
          for (const p of ports) {
            commit('add_available_serial_port', p);
          }
        })
    },
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
    toggle_connection({ state, commit, dispatch }, port) {
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
        .connect(port)
        .then((info) => {
          commit('set_connected', true);
          commit('set_info', info);

          dispatch('fetch_default_profile');
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
          console.error(err);
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