import semver from 'semver';
import { QuicVal } from '../serial/quic';
import { serial } from '../serial/serial';
import { decodeSemver } from '../util';

const store = {
  state: {
    serial: {
      rx: 0,
      smart_audio: 0,
      port_max: 1,
    },
    filter: {
      gyro: [{}, {}],
      dterm: [{}, {}]
    },
    osd: {
      elements: []
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
      throttle_dterm_attenuation: {}
    }
  },
  getters: {
    has_legacy_stickrates(state) {
      return semver.lte(decodeSemver(state.meta.version), "v0.1.0");
    }
  },
  mutations: {
    set_default_profile(state, profile) {
      profile.meta.name = profile.meta.name.replace(/\0/g, "");
      for (const key in profile) {
        state[key] = profile[key];
      }
    }
  },
  actions: {
    fetch_default_profile({ commit }) {
      return serial
        .get(QuicVal.DefaultProfile)
        .then(p => commit('set_default_profile', p));
    },
  }
}

export default store;