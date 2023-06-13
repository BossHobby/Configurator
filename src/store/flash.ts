import YAML from "yaml";
import { defineStore } from "pinia";
import { github } from "./util/github";
import { CBOR } from "./serial/cbor";

export interface RuntimeTarget {
  name: string;
  manufacturer: string;
  mcu: string;
}

export const TARGET_URL =
  "https://raw.githubusercontent.com/BossHobby/Targets/targets/";

export const useFlashStore = defineStore("flash", {
  state: () => ({
    releases: {},
    branches: {},
    targets: [] as RuntimeTarget[],
    manufacturers: {},
  }),
  actions: {
    fetch() {
      return Promise.all([
        github.fetchReleases().then((r) => (this.releases = r)),
        github.fetchBranches().then((b) => (this.branches = b)),
        fetch(TARGET_URL + "_index.json")
          .then((res) => res.json())
          .then((res) => {
            this.targets = res.targets;
            this.manufacturers = res.manufacturers;
          }),
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
