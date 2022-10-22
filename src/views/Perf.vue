<template>
  <div class="columns is-multiline">
    <div
      class="column is-6 my-3"
      v-for="(counter, index) in perf.counters"
      :key="'counter' + index"
    >
      <RealtimePlot
        :title="counter.name"
        :axis="Object.keys(counter).slice(1)"
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
});
</script>
