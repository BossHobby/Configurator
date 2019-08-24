import Vue from 'vue'
import Vuex from 'vuex'

import { get, post } from "@/api.js";

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    profile: {
      Setup: {
        InvertYaw: 1,
      },
      Rate: {
        Mode: 0,
        Silverware: {},
        Betaflight: {},
      }
    }
  },
  mutations: {
    set_profile(state, profile) {
      state.profile = profile
    }
  },
  actions: {
    fetch_profile({ commit }) {
      get("/api/profile")
        .then(p => commit('set_profile', p));
    },
    apply_profile({ commit }, profile) {
      post("/api/profile", profile)
        .then(p => commit('set_profile', p));
    }
  }
})
