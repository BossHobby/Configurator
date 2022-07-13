<template>
  <div class="columns">
    <div
      class="column is-6 my-3"
      v-for="(counter, index) in perf.counters"
      :key="'counter' + index"
    >
      <RealtimePlot
        :title="counters[index]"
        :axis="['min', 'max', 'current']"
        :input="counter"
      ></RealtimePlot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import RealtimePlot from "@/components/RealtimePlot.vue";
import { usePerfStore } from "@/store/perf";

export default defineComponent({
  name: "perf",
  components: {
    RealtimePlot,
  },
  setup() {
    return {
      perf: usePerfStore(),
    };
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
});
</script>
