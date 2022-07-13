import { useStateStore } from "./state";
import semver from "semver";
import { decodeSemver } from "@/store/util";
import { defineStore } from "pinia";
import type { target_info_t } from "./serial/types";

export interface local_target_info_t extends target_info_t {
  quic_protocol_semver: string;
  rx_protocol?: number;
}

export const useInfoStore = defineStore("info", {
  state: (): local_target_info_t => ({
    usart_ports: [],
    motor_pins: [],

    target_name: "",
    git_version: "",

    quic_protocol_version: 0,
    quic_protocol_semver: "v0.0.0",

    gyro_id: 0,
    rx_protocol: 0,
    rx_protocols: [],
    features: 0,
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
    is_read_only(state) {
      const fwstate = useStateStore();
      return state.quic_protocol_version < 5 || fwstate.failloop > 0;
    },
  },
  actions: {
    set_info(info) {
      this.$patch(info);
      if (this.quic_protocol_version) {
        this.quic_protocol_semver = decodeSemver(this.quic_protocol_version);
      }
    },
  },
});
