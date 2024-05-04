<template>
  <div class="columns is-multiline">
    <div class="column is-12">
      <GyroModel></GyroModel>
    </div>

    <div
      v-for="plot in plots"
      :key="plot.name"
      class="column"
      :class="['is-' + plot.size]"
      style="height: 35vw"
    >
      <RealtimePlot
        :title="plot.title"
        :axis="plot.axis"
        :input="state[plot.name]"
      >
      </RealtimePlot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import RealtimePlot from "@/components/RealtimePlot.vue";
import GyroModel from "@/panel/GyroModel.vue";
import { useStateStore } from "@/store/state";

export default defineComponent({
  name: "State",
  components: {
    RealtimePlot,
    GyroModel,
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
          title: "Rx Channels",
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
          title: "Gyro Raw",
          axis: ["Roll", "Pitch", "Yaw"],
        },
        {
          name: "gyro",
          size: 6,
          title: "Gyro Filter",
          axis: ["Roll", "Pitch", "Yaw"],
        },
        {
          name: "gyro_temp",
          size: 12,
          title: "Gyro Temperature",
          axis: "°C",
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
          title: "AccelRaw",
          axis: ["Roll", "Pitch", "Yaw"],
        },
        {
          name: "accel",
          size: 6,
          title: "AccelFilter",
          axis: ["Roll", "Pitch", "Yaw"],
        },
        {
          name: "pidoutput",
          size: 12,
          title: "Pid Output",
          axis: ["Roll", "Pitch", "Yaw"],
        },
      ],
    };
  },
});
</script>
