<template>
  <div class="grid gap-4 lg:grid-cols-2">
    <GyroModel />
    <section
      v-for="plot in plots"
      :key="plot.name"
      :aria-label="plot.title"
      class="h-80 min-w-0 rounded-lg border border-line bg-panel p-4"
    >
      <RealtimePlot
        :title="plot.title"
        :axis="plot.axis"
        :input="state[plot.name]"
      />
    </section>
  </div>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import RealtimePlot from "@/components/RealtimePlot.vue";
import GyroModel from "@/panel/GyroModel.vue";
import { useStateStore } from "@/store/state";

export default defineComponent({
  name: "Diagnostics",
  components: {
    GyroModel,
    RealtimePlot,
  },
  setup() {
    return {
      state: useStateStore(),
    };
  },
  data() {
    return {
      plots: [
        {
          name: "rx_filtered",
          size: 12,
          title: "RX Channels",
          axis: ["Roll", "Pitch", "Yaw", "Throttle"],
        },
        {
          name: "cpu_load",
          size: 12,
          title: "CPU Load",
          axis: "us",
        },
        {
          name: "gyro_raw",
          size: 6,
          title: "Raw Gyro",
          axis: ["Roll", "Pitch", "Yaw"],
        },
        {
          name: "gyro",
          size: 6,
          title: "Filtered Gyro",
          axis: ["Roll", "Pitch", "Yaw"],
        },
        {
          name: "gyro_temp",
          size: 6,
          title: "Gyro Temperature",
          axis: "°C",
        },
        {
          name: "altitude",
          size: 6,
          title: "Altitude",
          axis: "m",
        },
        {
          name: "GEstG",
          size: 12,
          title: "Gyro Vector",
          axis: ["Roll", "Pitch", "Yaw"],
        },
        {
          name: "accel_raw",
          size: 6,
          title: "Raw Accelerometer",
          axis: ["Roll", "Pitch", "Yaw"],
        },
        {
          name: "accel",
          size: 6,
          title: "Filtered Accelerometer",
          axis: ["Roll", "Pitch", "Yaw"],
        },
        {
          name: "pidoutput",
          size: 12,
          title: "PID Output",
          axis: ["Roll", "Pitch", "Yaw"],
        },
      ],
    };
  },
});
</script>
