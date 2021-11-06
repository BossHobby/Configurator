<template>
  <b-card>
    <h5 slot="header" class="mb-0">
      Model
      <b-button size="sm" class="my-2 mx-2" @click="cal_imu()">
        calibrate
      </b-button>
    </h5>
    <vgl-renderer style="width: 100%; height: 25vh" antialias>
      <template #scene>
        <vgl-scene background="#fff">
          <vgl-mesh
            :rotationX="rotation.x"
            :rotationY="rotation.y"
            :rotationZ="rotation.z"
          >
            <template #geometry>
              <vgl-box-geometry :width="7.5" :height="1.5" :depth="7.5" />
            </template>
            <template #material>
              <vgl-mesh-standard-material color="#777" />
            </template>
          </vgl-mesh>

          <vgl-axes-helper :size="5"></vgl-axes-helper>
          <vgl-ambient-light color="#ffeecc"></vgl-ambient-light>
          <vgl-directional-light
            :positionX="0"
            :positionY="1"
            :positionZ="1"
          ></vgl-directional-light>
        </vgl-scene>
      </template>
      <template #camera>
        <vgl-perspective-camera
          position="spherical"
          rotation="lookAt"
          :position-radius="15"
          :position-phi="1"
          :position-theta="0"
        />
      </template>
    </vgl-renderer>
  </b-card>
</template>

<script>
import { mapState, mapActions } from "vuex";

export default {
  name: "GyroModel",
  computed: {
    ...mapState({
      rate: (state) => state.profile.rate,
      gyro_vector: (state) => state.state.GEstG,
    }),
    rotation() {
      const rot = this.gyro_vector;
      if (!rot) {
        return { x: 0, y: 0, z: 0 };
      }
      const x = Math.atan2(rot[1], rot[2]);
      const y = Math.atan2(rot[0], rot[2]);
      return { x: x, y: 0, z: y };
    },
  },
  methods: {
    ...mapActions(["cal_imu"]),
  },
};
</script>

<style scoped>
</style>
