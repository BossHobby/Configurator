<template>
  <b-container>
    <b-row>
      <b-col sm="12">
        <GyroModel class="my-3"></GyroModel>
      </b-col>
      <b-col sm="12">
        <Plot
          title="Rx Channels"
          :interval="interval"
          :axis="['Roll', 'Pitch', 'Yaw', 'Throttle']"
          :input="blackbox.rx_filter"
        ></Plot>
      </b-col>
      <b-col sm="6">
        <Plot
          title="Gyro Raw"
          :interval="interval"
          :axis="['Roll', 'Pitch', 'Yaw']"
          :input="blackbox.gyro_raw"
        ></Plot>
      </b-col>
      <b-col sm="6">
        <Plot
          title="Gyro Filter"
          :interval="interval"
          :axis="['Roll', 'Pitch', 'Yaw']"
          :input="blackbox.gyro_filter"
        ></Plot>
      </b-col>
      <b-col sm="12">
        <Plot
          title="Gyro Vector"
          :interval="interval"
          :axis="['Roll', 'Pitch', 'Yaw']"
          :input="blackbox.gyro_vector"
        ></Plot>
      </b-col>
      <b-col sm="6">
        <Plot
          title="AccelRaw"
          :interval="interval"
          :axis="['Roll', 'Pitch', 'Yaw']"
          :input="blackbox.accel_raw"
        ></Plot>
      </b-col>
      <b-col sm="6">
        <Plot
          title="AccelFilter"
          :interval="interval"
          :axis="['Roll', 'Pitch', 'Yaw']"
          :input="blackbox.accel_filter"
        ></Plot>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { mapState, mapActions } from "vuex";
import Plot from "@/components/Plot";
import GyroModel from "@/components/GyroModel";

export default {
  name: "blackbox",
  components: {
    Plot,
    GyroModel
  },
  data() {
    return {
      start: Date.now(),
      interval: 10
    };
  },
  computed: {
    ...mapState({
      blackbox: state => state.blackbox
    })
  },
  methods: mapActions(["set_blackbox_rate"]),
  created() {
    this.set_blackbox_rate(4);
  },
  destroyed() {
    this.set_blackbox_rate(2);
  }
};
</script>
