<template>
  <b-container>
    <b-row>
      <b-col sm="12">
        <GyroModel class="my-3"></GyroModel>
      </b-col>

      <b-col v-for="plot in plots" :key="plot.name" :sm="plot.size">
        <RealtimePlot
          :title="plot.title"
          :axis="plot.axis"
          :input="state[plot.name]"
        >
        </RealtimePlot>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { mapState } from "vuex";

import RealtimePlot from "@/components/RealtimePlot";
import GyroModel from "@/components/GyroModel";

export default {
  name: "state",
  components: {
    RealtimePlot,
    GyroModel,
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
  computed: mapState(["state"]),
};
</script>
