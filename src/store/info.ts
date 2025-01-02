import { useStateStore } from "./state";
import semver from "semver";
import { decodeSemver } from "@/store/util";
import { defineStore } from "pinia";
import type { target_info_t } from "./types";
import { $enum } from "ts-enum-util";
import { useConstantStore } from "./constants";
import { useDefaultProfileStore } from "./default_profile";

export interface local_target_info_t extends target_info_t {
  quic_protocol_semver: string;
  rx_protocol?: number;
  gyro_name: string;
}

export const useInfoStore = defineStore("info", {
  state: (): local_target_info_t => ({
    usart_ports: [],
    motor_pins: [],

    mcu: "",
    target_name: "",
    git_version: "",

    quic_protocol_version: 0,
    quic_protocol_semver: "v0.0.0",

    gyro_id: 0,
    gyro_name: "",
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
    quic_semver_gt(state) {
      return (version) => {
        return semver.gt(state.quic_protocol_semver, version);
      };
    },
    quic_semver_gte(state) {
      return (version) => {
        return semver.gte(state.quic_protocol_semver, version);
      };
    },
    version_too_old(state) {
      const default_profile = useDefaultProfileStore();
      return (
        state.quic_protocol_version < 5 ||
        semver.lte(decodeSemver(default_profile.meta.version), "v0.1.0")
      ); // unsupported osd
    },
    is_read_only(state) {
      const fwstate = useStateStore();
      return this.version_too_old || fwstate.failloop > 0;
    },
  },
  actions: {
    set_info(info) {
      this.$patch(info);
      if (this.quic_protocol_version) {
        this.quic_protocol_semver = decodeSemver(this.quic_protocol_version);
      }

      const constants = useConstantStore();
      this.gyro_name = $enum(constants.GyroType).getKeys()[this.gyro_id];
    },
  },
});
