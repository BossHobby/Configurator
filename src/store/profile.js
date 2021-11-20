import { get, post } from "@/store/api.js";
import { createHelpers } from "@/store/helper.js";

const { get_profile_field, update_profile_field } = createHelpers("profile")

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
        elements
      };
    }
  },
  actions: {
    fetch_profile({ commit }) {
      return get("/api/default_profile")
        .then(p => commit('set_default_profile', p))
        .then(() => get("/api/profile"))
        .then(p => commit('set_profile', p));
    },
    apply_profile({ commit }, profile) {
      profile.meta.datetime = Math.floor(Date.now() / 1000);
      return post("/api/profile", profile)
        .then(p => commit('set_profile', p))
        .then(() => commit('append_alert', { type: "success", msg: "profile applied!" }));
    },
  }
}

export default store;