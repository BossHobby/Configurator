import { defineStore } from "pinia";
import { github } from "./util/github";

export const useFlashStore = defineStore("flash", {
  state: () => ({
    firmware_releases: {},
  }),
  actions: {
    fetch_firmware_releases() {
      return github.fetchReleases().then((r) => (this.firmware_releases = r));
    },
  },
});
