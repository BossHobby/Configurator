import YAML from "yaml";
import { defineStore } from "pinia";
import { github } from "./util/github";
import { CBOR } from "./serial/cbor";

export interface RuntimeTarget {
  name: string;
  target: string;
  manufacturer: string;
  mcu: string;
}

export const TARGET_URL =
  "https://raw.githubusercontent.com/BossHobby/Targets/targets/";

export const useFlashStore = defineStore("flash", {
  state: () => ({
    releases: {},
    branches: {},
    pullRequests: {},
    targets: [] as RuntimeTarget[],
    manufacturers: {},
  }),
  actions: {
    fetchTargets() {
      return fetch(TARGET_URL + "_index.json")
        .then((res) => res.json())
        .then((res) => {
          this.targets = res.targets;
          this.manufacturers = res.manufacturers;
        });
    },
    fetchReleases() {
      return github.fetchReleases().then((r) => (this.releases = r));
    },
    fetchBranches() {
      return github.fetchBranches().then((b) => (this.branches = b));
    },
    fetchPullRequests() {
      return github.fetchPullRequests().then((p) => (this.pullRequests = p));
    },
    async fetch(source: string) {
      if (this.targets.length == 0) {
        await this.fetchTargets();
      }
      switch (source) {
        case "release":
          return this.fetchReleases();
        case "branch":
          return this.fetchBranches();
        case "pull_request":
          return this.fetchPullRequests();
        default:
          break;
      }
    },
    fetchRuntimeConfig(target: string) {
      return fetch(TARGET_URL + target + ".yaml")
        .then((res) => {
          if (!res.ok) {
            return Promise.reject(res);
          }
          return res.text();
        })
        .then((res) => YAML.parse(res))
        .then((target) => CBOR.encode(target));
    },
  },
});
