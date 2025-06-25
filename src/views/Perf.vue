<template>
  <div class="columns is-multiline">
    <div v-if="totalTaskPerf" class="column is-12 my-3">
      <RealtimePlot
        :title="'Total Task Performance'"
        :axis="Object.keys(totalTaskPerf).slice(1)"
        :input="totalTaskPerf"
        class="image is-fullwidth is-4by3"
      ></RealtimePlot>
    </div>
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
import { defineComponent, computed } from "vue";
import RealtimePlot from "@/components/RealtimePlot.vue";
import { usePerfStore } from "@/store/perf";

export default defineComponent({
  name: "Perf",
  components: {
    RealtimePlot,
  },
  setup() {
    const perf = usePerfStore();

    const totalTaskPerf = computed(() => {
      if (!perf.counters || perf.counters.length === 0) {
        return null;
      }

      // Create an object to store the summed values
      const total = {
        name: "Total Task Performance",
      };

      // Get the keys from the first counter (excluding 'name')
      const firstCounter = perf.counters[0];
      const valueKeys = Object.keys(firstCounter).filter(
        (key) => key !== "name",
      );

      // Initialize all value keys to 0
      valueKeys.forEach((key) => {
        total[key] = 0;
      });

      // Sum up all counter values except USB task
      perf.counters.forEach((counter) => {
        // Skip USB task
        if (counter.name && counter.name.toLowerCase().includes("usb")) {
          return;
        }

        valueKeys.forEach((key) => {
          if (typeof counter[key] === "number") {
            total[key] += counter[key];
          }
        });
      });

      return total;
    });

    return {
      perf,
      totalTaskPerf,
    };
  },
});
</script>
