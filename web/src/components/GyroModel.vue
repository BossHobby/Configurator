<template>
  <b-card>
    <h5 slot="header" class="mb-0">Model</h5>
    <vgl-renderer style="width: 100%; height: 35vh" antialias>
      <vgl-scene background-color="#ffffff">
        <vgl-box-geometry name="cube" width="7.5" height="1.5" depth="7.5"></vgl-box-geometry>
        <vgl-mesh-standard-material name="std" color="#777"></vgl-mesh-standard-material>
        <vgl-mesh geometry="cube" material="std" position="0 0 0" :rotation="rotation"></vgl-mesh>
        <vgl-axes-helper size="140"></vgl-axes-helper>
        <vgl-ambient-light color="#ffeecc"></vgl-ambient-light>
        <vgl-directional-light position="0 1 1"></vgl-directional-light>
      </vgl-scene>
      <vgl-perspective-camera :orbit-position="`15 ${0.35 * Math.PI} ${-0.5 * Math.PI}`"></vgl-perspective-camera>
    </vgl-renderer>
  </b-card>
</template>

<script>
import { mapState, mapActions } from "vuex";

export default {
  name: "GyroModel",
  computed: {
    ...mapState(["gyro"]),
    ...mapState({
      Rate: state => state.profile.Rate
    }),
    rotation() {
      const rot = this.gyro.gyro_rot;
      if (!rot) {
        return "0 0 0";
      }
      const x = Math.atan2(rot[0], rot[2]);
      const y = Math.atan2(rot[1], rot[2]);
      return `${x} 0 ${-y}`;
    }
  },
  methods: {
    ...mapActions(["fetch_gyro"])
  },
  created() {
    this.start = Date.now();

    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => {
      this.fetch_gyro();
    }, 250);
  },
  destroyed() {
    clearInterval(this.interval);
  }
};
</script>

<style scoped>
</style>
