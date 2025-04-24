import { defineStore } from "pinia";
import semver from "semver";
import { QuicVal } from "./serial/quic";
import { serial } from "./serial/serial";
import { decodeSemver } from "./util";

export const useDefaultProfileStore = defineStore("default_profile", {
  state: () => ({
    serial: {
      rx: 0,
      smart_audio: 0,
      hdzero: 0,
      gps: 0,
    },
    filter: {
      gyro: [{}, {}],
      dterm: [{}, {}],
    },
    osd: {
      callsign: "",
      elements: [],
      elements_hd: [],
    },
    meta: {
      version: 0,
      datetime: 0,
    },
    motor: {
      invert_yaw: 1,
    },
    rate: {
      mode: 0,
      silverware: {},
      betaflight: {},
    },
    voltage: {},
    receiver: {
      lqi_source: -1,
      aux: [],
    },
    pid: {
      pid_profile: 0,
      pid_rates: [{}],
      stick_profile: 0,
      stick_rates: [{}],
      big_angle: {},
      small_angle: {},
      throttle_dterm_attenuation: {},
    },
  }),
  getters: {
    has_legacy_stickrates(state) {
      return semver.lte(decodeSemver(state.meta.version), "v0.1.0");
    },
    has_legacy_osd(state) {
      return semver.lte(decodeSemver(state.meta.version), "v0.2.4");
    },
  },
  actions: {
    fetch_default_profile() {
      return serial.get(QuicVal.DefaultProfile).then((profile) => {
        profile.meta.name = profile.meta.name.replace(/\0/g, "");
        this.$patch(profile);
      });
    },
  },
});
