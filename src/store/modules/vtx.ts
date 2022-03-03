import { QuicVal } from '../serial/quic';
import { serial } from '../serial/serial';
import { createHelpers } from "@/store/helper.js";


const { get_vtx_field, update_vtx_field } = createHelpers("vtx")

const store = {
  state: {
    settings: {
      protocol: 0,
      detected: 0,
      channel: 0,
      band: 0,
    }
  },
  getters: {
    get_vtx_field,
  },
  mutations: {
    update_vtx_field,
    set_vtx_settings_initial(state, settings) {
      state.settings = settings;
    },
    set_vtx_settings(state, settings) {
      const protocol = settings.detected == 0 ? state.settings.protocol : settings.protocol;
      state.settings = {
        ...settings,
        protocol,
      };
    },
  },
  actions: {
    fetch_vtx_settings({ commit }) {
      return serial
        .get(QuicVal.VtxSettings)
        .then(v => commit('set_vtx_settings_initial', v))
    },
    apply_vtx_settings({ commit }, vtx_settings) {
      return serial
        .set(QuicVal.VtxSettings, vtx_settings)
        .then(v => commit('set_vtx_settings_initial', v))
        .then(() => {
          commit('append_alert', { type: "success", msg: "Apply successful!" });
        })
        .catch(() => {
          commit('append_alert', { type: "danger", msg: "Apply failed" });
        });
    },
    update_vtx_settings({ commit, state }) {
      if (state.settings.detected == 0) {
        return serial
          .get(QuicVal.VtxSettings)
          .then(v => commit('set_vtx_settings', v))
      }
    }
  }
}

export default store;