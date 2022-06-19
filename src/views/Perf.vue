<template>
  <b-container>
    <b-row>
      <b-col
        v-for="(counter, index) in perf.counters"
        :key="'counter' + index"
        sm="6"
      >
        <RealtimePlot
          :title="counters[index]"
          :axis="['min', 'max', 'current']"
          :input="counter"
        ></RealtimePlot>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { mapState } from "vuex";

import RealtimePlot from "@/components/RealtimePlot.vue";

export default {
  name: "perf",
  components: {
    RealtimePlot,
  },
  data() {
    return {
      counters: [
        "PERF_COUNTER_TOTAL",
        "PERF_COUNTER_GYRO",
        "PERF_COUNTER_CONTROL",
        "PERF_COUNTER_RX",
        "PERF_COUNTER_OSD",
        "PERF_COUNTER_MISC",
        "PERF_COUNTER_BLACKBOX",
        "PERF_COUNTER_DEBUG",
      ],
    };
  },
  computed: mapState(["perf"]),
};
</script>
