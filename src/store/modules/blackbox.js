import { QuicBlackbox, QuicCmd } from '../serial/quic';
import { serial } from '../serial/serial';
import { Log } from '@/log';

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
      return serial
        .command(QuicCmd.Blackbox, QuicBlackbox.Reset)
        .then(() => {
          commit('append_alert', { type: "success", msg: "Blackbox successfully reset" });
        })
        .catch(err => {
          commit('append_alert', { type: "danger", msg: err });
        })
    },
    list_blackbox({ commit }) {
      return serial
        .command(QuicCmd.Blackbox, QuicBlackbox.List)
        .then(p => commit('set_blackbox_list', p.payload[0]));
    },
    download_blackbox(_, index) {
      return serial
        .command(QuicCmd.Blackbox, QuicBlackbox.Get, index)
        .then(p => Log.info("blackbox", p));
    }
  }
}

export default store;