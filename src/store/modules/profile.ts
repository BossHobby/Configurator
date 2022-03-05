import { createHelpers } from "@/store/helper.js";
import { serial } from '../serial/serial';
import { QuicVal } from '../serial/quic';
import { Log } from '@/log';

const { get_profile_field, update_profile_field } = createHelpers("profile")

function makeSemver(major, minor, patch) {
  return ((major << 16) | (minor << 8) | patch)
}

function migrateProfile(profile, version) {
  switch (version) {
    case makeSemver(0, 1, 0):
      profile.rate.profile = 0;
      profile.rate.rates = [
        {
          mode: profile.rate.mode,
          rate: [
            profile.rate.mode == 1 ? profile.rate.betaflight.rc_rate : profile.rate.silverware.max_rate,
            profile.rate.mode == 1 ? profile.rate.betaflight.super_rate : profile.rate.silverware.acro_expo,
            profile.rate.mode == 1 ? profile.rate.betaflight.expo : profile.rate.silverware.angle_expo,
          ]
        },
        {
          mode: profile.rate.mode == 1 ? 0 : 1,
          rate: [
            profile.rate.mode == 0 ? profile.rate.betaflight.rc_rate : profile.rate.silverware.max_rate,
            profile.rate.mode == 0 ? profile.rate.betaflight.super_rate : profile.rate.silverware.acro_expo,
            profile.rate.mode == 0 ? profile.rate.betaflight.expo : profile.rate.silverware.angle_expo,
          ]
        }
      ]
      break;
  }
  return profile;
}

const store = {
  state: {
    serial: {
      rx: 0,
      smart_audio: 0,
      hdzero: 0,
      port_max: 1,
    },
    filter: {
      gyro: [{}, {}],
      dterm: [{}, {}]
    },
    osd: {
      callsign: "",
      elements: [],
      elements_hd: []
    },
    meta: {
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
    get_profile_field,
    current_pid_rate: state => {
      return state.pid.pid_rates[state.pid.pid_profile];
    },
    current_stick_rate: state => {
      return state.pid.stick_rates[state.pid.stick_profile];
    }
  },
  mutations: {
    update_profile_field,
    set_profile(state, profile) {
      profile.meta.name = profile.meta.name.replace(/\0/g, "");
      for (const key in profile) {
        state[key] = profile[key];
      }
    },
    set_current_pid_rate(state, rate) {
      const rates = [...state.pid.pid_rates];
      rates[state.pid.pid_profile] = rate;
      state.pid = {
        ...state.pid,
        pid_rates: rates
      };
    },
    set_current_stick_rate(state, rate) {
      const rates = [...state.pid.stick_rates];
      rates[state.pid.stick_profile] = rate;
      state.pid = {
        ...state.pid,
        stick_rates: rates
      };
    },
    set_osd_elements(state, elements) {
      state.osd = {
        ...state.osd,
        elements
      };
    },
    set_osd_elements_hd(state, elements) {
      state.osd = {
        ...state.osd,
        elements_hd: elements
      };
    }
  },
  actions: {
    fetch_profile({ commit }) {
      return serial
        .get(QuicVal.Profile)
        .then(p => commit('set_profile', p));
    },
    apply_profile({ commit, rootState }, profile) {
      const firmwareVersion = rootState.default_profile.meta.version;
      const profileVersion = profile.meta.version;

      let p = profile
      if (firmwareVersion != profileVersion) {
        p = migrateProfile(p, profileVersion);
      }

      p.meta.datetime = Math.floor(Date.now() / 1000);

      return serial
        .set(QuicVal.Profile, p)
        .then(p => commit('set_profile', p))
        .then(() => commit('append_alert', { type: "success", msg: "Profile applied!" }))
        .then(() => commit('reset_needs_apply'))
        .catch(err => {
          Log.error(err);
          commit('append_alert', { type: "danger", msg: "Apply failed! " + err });
        })
    },
  }
}

export default store;