import semver from "semver";
import { decodeSemver } from "@/store/util";

const store = {
  state: {
    usart_ports: [],
    motor_pins: [],
    quic_protocol_version: null,
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
        const quic = decodeSemver(state.quic_protocol_version);
        return semver.gt(quic, version);
      };
    },
  },
  mutations: {
    set_info(state, info) {
      for (const key in info) {
        state[key] = info[key];
      }
    },
  },
  actions: {},
};

export default store;
