import semver from "semver";
import { decodeSemver } from "@/store/util";
import { defineStore } from "pinia";

export const useInfoStore = defineStore("info", {
  state: () => ({
    usart_ports: [],
    motor_pins: [],
    quic_protocol_version: 0,
    quic_protocol_semver: "v0.0.0",
    features: null,
  }),
  getters: {
    has_feature(state) {
      return (feature) => {
        if (state.features == null) {
          return true;
        }
        return state.features & feature;
      };
    },
    quicVersionGt(state) {
      return (version) => {
        return semver.gt(state.quic_protocol_semver, version);
      };
    },
  },
  actions: {
    set_info(info) {
      for (const key in info) {
        this[key] = info[key];
      }
      if (this.quic_protocol_version) {
        this.quic_protocol_semver = decodeSemver(this.quic_protocol_version);
      }
    },
  },
});
