import { get, post } from "@/api.js";

const store = {
  state: {
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
    channel: {
      aux: [],
    },
    pid: {
      pid_profile: 0,
      pid_rates: [{}],
      stick_profile: 0,
      stick_rates: [{}],
    }
  },
  getters: {
    current_pid_rate: state => {
      return state.pid.pid_rates[state.pid.pid_profile];
    }
  },
  mutations: {
    set_profile(state, profile) {
      for (const key in profile) {
        if (profile.hasOwnProperty(key)) {
          state[key] = profile[key];
        }
      }
    },
    set_current_pid_rate(state, rate) {
      const rates = [...state.pid.pid_rates];
      rates[state.pid.pid_profile] = rate;
      state.pid = {
        ...state.pid,
        pid_rates: rates
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
        .then(() => commit('append_alert', "profile applied!"));
    },
  }
}

export default store;