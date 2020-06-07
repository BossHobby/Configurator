<template>
  <b-card>
    <h5 slot="header" class="mb-0">
      Model
      <b-button size="sm" class="my-2 mx-2" @click="cal_imu()">calibrate</b-button>
    </h5>
    <vgl-renderer camera="camera" scene="scene" style="width: 100%; height: 25vh" antialias>
      <vgl-scene name="scene" background-color="#ffffff">
        <vgl-box-geometry name="cube" width="7.5" height="1.5" depth="7.5"></vgl-box-geometry>
        <vgl-mesh-standard-material name="std" color="#777"></vgl-mesh-standard-material>
        <vgl-mesh geometry="cube" material="std" position="0 0 0" :rotation="rotation"></vgl-mesh>
        <vgl-axes-helper size="140"></vgl-axes-helper>
        <vgl-ambient-light color="#ffeecc"></vgl-ambient-light>
        <vgl-directional-light position="0 1 1"></vgl-directional-light>
      </vgl-scene>

      <vgl-perspective-camera
        name="camera"
        :orbit-position="`15 ${0.35 * Math.PI} ${-0.5 * Math.PI}`"
      ></vgl-perspective-camera>
    </vgl-renderer>
  </b-card>
</template>

<script>
import { mapState, mapActions } from "vuex";

export default {
  name: "GyroModel",
  computed: {
    ...mapState({
      rate: state => state.profile.rate,
      gyro_vector: state => state.blackbox.GEstG
    }),
    rotation() {
      const rot = this.gyro_vector;
      if (!rot) {
        return "0 0 0 XYZ";
      }
      const x = Math.atan2(rot[0], rot[2]);
      const y = Math.atan2(rot[1], rot[2]);
      return `${x} 0 ${-y} XYZ`;
    }
  },
  methods: {
    ...mapActions(["cal_imu"])
  }
};
</script>

<style scoped>
</style>
