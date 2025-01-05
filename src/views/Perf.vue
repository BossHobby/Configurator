<template>
  <div class="columns is-multiline">
    <div
      v-for="(counter, index) in perf.counters"
      :key="'counter' + index"
      class="column is-6 my-3"
    >
      <RealtimePlot
        :title="counter.name"
        :axis="Object.keys(counter).slice(1)"
        :input="counter"
        class="image is-fullwidth is-4by3"
      ></RealtimePlot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import RealtimePlot from "@/components/RealtimePlot.vue";
import { usePerfStore } from "@/store/perf";

export default defineComponent({
  name: "Perf",
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
