import semver from "semver";
import { decodeSemver } from "@/store/util";

const store = {
  state: {
    usart_ports: [],
    motor_pins: [],
    quic_protocol_version: null,
    quic_protocol_semver: null,
    features: null,
  },
  getters: {
    has_feature(state) {
      return (feature) => {
        if (state.features == null) {
          return true;
        }
        return state.features & feature;
      };
    },
    is_read_only(state) {
      return state.quic_protocol_version < 5;
    },
    quicVersionGt(state) {
      return (version) => {
        return semver.gt(state.quic_protocol_semver, version);
      };
    },
  },
  mutations: {
    set_info(state, info) {
      for (const key in info) {
        state[key] = info[key];
      }
      state.quic_protocol_semver = decodeSemver(state.quic_protocol_version);
    },
  },
  actions: {},
};

export default store;
