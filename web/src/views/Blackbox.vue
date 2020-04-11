<template>
  <b-container>
    <b-row>
      <!--
      <b-col sm="12">
        <b-button size="sm" class="my-2 mx-2" @click="fetch()">fetch</b-button>
        <b-button size="sm" class="my-2 mx-2" @click="reset_blackbox()">reset</b-button>
      </b-col>
      -->
      <b-col sm="12">
        <GyroModel class="my-3"></GyroModel>
      </b-col>

      <b-col v-for="plot in plots" :key="plot.name" :sm="plot.size">
        <RealtimePlot :title="plot.title" ref="plot" :axis="plot.axis" :input="blackbox[plot.name]"></RealtimePlot>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { mapState, mapActions } from "vuex";
import RealtimePlot from "@/components/RealtimePlot";
import GyroModel from "@/components/GyroModel";

export default {
  name: "blackbox",
  components: {
    RealtimePlot,
    GyroModel
  },
  data() {
    return {
      plots: [
        {
          name: "rx_filter",
          size: 12,
          title: "Rx Channels",
          axis: ["Roll", "Pitch", "Yaw", "Throttle"]
        },
        {
          name: "gyro_raw",
          size: 6,
          title: "Gyro Raw",
          axis: ["Roll", "Pitch", "Yaw"]
        },
        {
          name: "gyro_filter",
          size: 6,
          title: "Gyro Filter",
          axis: ["Roll", "Pitch", "Yaw"]
        },
        {
          name: "gyro_vector",
          size: 12,
          title: "Gyro Vector",
          axis: ["Roll", "Pitch", "Yaw"]
        },
        {
          name: "accel_raw",
          size: 6,
          title: "AccelRaw",
          axis: ["Roll", "Pitch", "Yaw"]
        },
        {
          name: "accel_filter",
          size: 6,
          title: "AccelFilter",
          axis: ["Roll", "Pitch", "Yaw"]
        },
        {
          name: "pid_output",
          size: 12,
          title: "Pid Output",
          axis: ["Roll", "Pitch", "Yaw"]
        }
      ]
    };
  },
  computed: {
    ...mapState({
      blackbox: state => state.blackbox
    })
  },
  methods: {
    ...mapActions(["set_blackbox_rate", "fetch_blackbox", "reset_blackbox"]),
    fetch() {
      for (const p of this.$refs.plot) {
        p.reset();
      }
      this.fetch_blackbox();
    }
  },
  created() {
    this.set_blackbox_rate(4);
  },
  destroyed() {
    this.set_blackbox_rate(2);
  }
};
</script>
