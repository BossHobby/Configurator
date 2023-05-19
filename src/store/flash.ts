import { defineStore } from "pinia";
import { github } from "./util/github";

export const useFlashStore = defineStore("flash", {
  state: () => ({
    releases: {},
    branches: {},
  }),
  actions: {
    fetch() {
      return Promise.all([
        github.fetchReleases().then((r) => (this.releases = r)),
        github.fetchBranches().then((b) => (this.branches = b)),
      ]);
    },
  },
});
