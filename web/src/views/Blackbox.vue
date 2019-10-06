<template>
  <b-container>
    <Plot
      title="Rx Channels"
      :interval="interval"
      :axis="['Roll', 'Pitch', 'Yaw', 'Throttle']"
      :input="blackbox.RxRaw"
    ></Plot>
    <Plot
      title="Gyro Raw"
      :interval="interval"
      :axis="['Roll', 'Pitch', 'Yaw']"
      :input="blackbox.GyroRaw"
    ></Plot>
    <Plot
      title="Gyro Filter"
      :interval="interval"
      :axis="['Roll', 'Pitch', 'Yaw']"
      :input="blackbox.GyroFilter"
    ></Plot>
    <Plot
      title="Gyro Vector"
      :interval="interval"
      :axis="['Roll', 'Pitch', 'Yaw']"
      :input="blackbox.GyroVector"
    ></Plot>
  </b-container>
</template>

<script>
import { mapState, mapActions } from "vuex";
import Plot from "@/components/Plot";

export default {
  name: "blackbox",
  components: {
    Plot
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
