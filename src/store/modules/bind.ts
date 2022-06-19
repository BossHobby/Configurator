import { serial } from "../serial/serial";
import { QuicVal } from "../serial/quic";
import { Log } from "@/log";

const store = {
  state: {
    info: {
      bind_saved: 0,
    },
  },
  getters: {},
  mutations: {
    set_bind_info(state, info) {
      state.info = info;
    },
  },
  actions: {
    fetch_bind_info({ commit }) {
      return serial
        .get(QuicVal.BindInfo)
        .then((b) => commit("set_bind_info", b));
    },
    apply_bind_info({ commit }, info) {
      return serial
        .set(QuicVal.BindInfo, info)
        .then((b) => commit("set_bind_info", b))
        .then((b) => commit("track_key_change", "bind.info"))
        .then(() =>
          commit("append_alert", { type: "success", msg: "Bind info applied!" })
        )
        .catch((err) => {
          Log.error(err);
          commit("append_alert", {
            type: "danger",
            msg: "Apply failed! " + err,
          });
        });
    },
  },
};

export default store;
