<template>
  <div class="grid grid-cols-12 gap-4">
    <div v-if="totalTaskPerf" class="min-w-0 my-3 col-span-12 md:col-span-12">
      <RealtimePlot
        :title="'Total Task Performance'"
        :axis="Object.keys(totalTaskPerf).slice(1)"
        :input="totalTaskPerf"
        class="block w-full aspect-[4/3]"
      ></RealtimePlot>
    </div>
    <div
      v-for="(counter, index) in perf.counters"
      :key="'counter' + index"
      class="min-w-0 my-3 col-span-12 md:col-span-6"
    >
      <RealtimePlot
        :title="counter.name"
        :axis="Object.keys(counter).slice(1)"
        :input="counter"
        class="block w-full aspect-[4/3]"
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
