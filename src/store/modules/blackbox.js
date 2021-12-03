import { QuicBlackbox, QuicCmd } from '../serial/quic';
import { serial } from '../serial/serial';


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
        .then(list => commit('set_blackbox_list', list));
    },
  }
}

export default store;