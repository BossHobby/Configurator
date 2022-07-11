import { serial } from "./serial/serial";
import { QuicVal } from "./serial/quic";
import { defineStore } from "pinia";

export const usePerfStore = defineStore("perf", {
  state: () => ({
    counters: [],
  }),
  actions: {
    fetch_perf_counters() {
      return serial
        .get(QuicVal.PerfCounters)
        .then((update) => (this.counters = update));
    },
  },
});
