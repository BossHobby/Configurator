import YAML from "yaml";
import { defineStore } from "pinia";
import { github } from "./util/github";
import { CBOR } from "./serial/cbor";

export const TARGET_URL =
  "https://raw.githubusercontent.com/BossHobby/Targets/targets/";

export const useFlashStore = defineStore("flash", {
  state: () => ({
    releases: {},
    branches: {},
    targets: [],
  }),
  actions: {
    fetch() {
      return Promise.all([
        github.fetchReleases().then((r) => (this.releases = r)),
        github.fetchBranches().then((b) => (this.branches = b)),
        fetch(TARGET_URL + "_index.json").then(
          async (res) => (this.targets = await res.json())
        ),
      ]);
    },
    fetchRuntimeConfig(target: string) {
      return fetch(TARGET_URL + target + ".yaml")
        .then((res) => res.text())
        .then((res) => YAML.parse(res))
        .then((target) => CBOR.encode(target));
    },
  },
});
