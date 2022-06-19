import { github } from "../util/github";

const store = {
  state: {
    firmware_releases: {},
  },
  getters: {},
  mutations: {
    set_firmware_releases(state, firmware_releases) {
      state.firmware_releases = firmware_releases;
    },
  },
  actions: {
    fetch_firmware_releases({ commit }) {
      return github
        .fetchReleases()
        .then((p) => commit("set_firmware_releases", p));
    },
  },
};

export default store;
