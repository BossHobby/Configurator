import { createStore } from "vuex";

import { serial } from "./serial/serial";
import { QuicCmd, QuicVal } from "./serial/quic";

import profileModule from "./modules/profile";
import defaultProfileModule from "./modules/default_profile";
import infoModule from "./modules/info";
import perfModule from "./modules/perf";
import blackboxModule from "./modules/blackbox";
import stateModule from "./modules/state";
import motorModule from "./modules/motor";
import vtxModule from "./modules/vtx";
import bindModule from "./modules/bind";
import serialModule from "./modules/serial";
import flashModule from "./modules/flash";
import constantsModule from "./modules/constants";
import templatesModule from "./modules/templates";

const rebootNeededKeys = [
  "profile.serial.",
  "profile.receiver.protocol",
  "bind.info",
];

const applyNeededKeys = ["profile."];

export const store = createStore({
  modules: {
    profile: profileModule,
    default_profile: defaultProfileModule,
    info: infoModule,
    blackbox: blackboxModule,
    state: stateModule,
    motor: motorModule,
    vtx: vtxModule,
    perf: perfModule,
    bind: bindModule,
    serial: serialModule,
    flash: flashModule,
    constants: constantsModule,
    templates: templatesModule,
  },
  state: {
    needs_apply: false,
    needs_reboot: false,

    log: [] as any[],
    alerts: [] as any[],

    pid_rate_presets: [],
  },
  getters: {
    is_read_only(state) {
      return state.info.quic_protocol_version < 5 || state.state.failloop > 0;
    },
  },
  mutations: {
    set_pid_rate_presets(state, pid_rate_presets) {
      state.pid_rate_presets = pid_rate_presets;
    },

    append_log(state, line) {
      if (state.log.length < 500) {
        state.log = [...state.log, line];
      } else {
        state.log = [line];
      }
    },
    clear_log(state) {
      state.log = [];
    },

    append_alert(state, alert) {
      state.alerts = [
        ...state.alerts,
        {
          id: Date.now().toString() + "-" + state.alerts.length.toString(),
          ...alert,
        },
      ];
    },
    pop_alert(state, id) {
      state.alerts = [...state.alerts.filter((a) => a.id != id)];
    },

    track_key_change(state, path) {
      for (const key of applyNeededKeys) {
        if (path.startsWith(key)) {
          state.needs_apply = true;
          break;
        }
      }

      for (const key of rebootNeededKeys) {
        if (path.startsWith(key)) {
          state.needs_reboot = true;
          break;
        }
      }
    },

    reset_needs_apply(state) {
      state.needs_apply = false;
    },
    reset_needs_reboot(state) {
      state.needs_apply = false;
      state.needs_reboot = false;
    },
  },
  actions: {
    fetch_pid_rate_presets({ commit }) {
      return serial
        .get(QuicVal.PidRatePresets)
        .then((p) => commit("set_pid_rate_presets", p));
    },
    cal_imu() {
      return serial.command(QuicCmd.CalImu);
    },
    cal_sticks() {
      return serial.command(QuicCmd.CalSticks);
    },
    reset_profile({ state, dispatch }) {
      return dispatch("apply_profile", state.default_profile);
    },
  },
});
