<template>
  <b-card>
    <h5 slot="header" class="mb-0">Motor</h5>
    <b-row>
      <b-col sm="4" class="my-2">
        <label for="invert-yaw">Invert Yaw</label>
      </b-col>
      <b-col sm="8" class="my-2">
        <b-form-select id="invert-yaw" v-model.number="Motor.InvertYaw" :options="invertYawModes"></b-form-select>
      </b-col>
    </b-row>
    <b-row>
      <b-col sm="4" class="my-2">
        <label for="digital-idle">Digital Idle</label>
      </b-col>
      <b-col sm="8" class="my-2">
        <b-form-input id="digital-idle" type="number" step="0.1" v-model.number="Motor.DigitalIdle"></b-form-input>
      </b-col>
    </b-row>
    <b-row>
      <b-col sm="4" class="my-2">
        <label for="gyro-orientation">Gyro Orientation</label>
      </b-col>
      <b-col sm="8" class="my-2">
        <b-form-select
          id="gyro-orientation"
          v-model.number="Motor.GyroOrientation"
          :options="gyroOrientations"
        ></b-form-select>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "Motor",
  data() {
    return {
      invertYawModes: [
        { value: 0, text: "Props In" },
        { value: 1, text: "Props Out" }
      ],
      gyroOrientations: [
        { value: 0, text: "ROTATE_NONE" },
        { value: 1, text: "ROTATE_45_CCW" },
        { value: 2, text: "ROTATE_45_CW" },
        { value: 3, text: "ROTATE_90_CW" },
        { value: 4, text: "ROTATE_90_CCW" },
        { value: 5, text: "ROTATE_180" },
        { value: 6, text: "FLIP_180" }
      ]
    };
  },
  computed: mapState({
    Motor: state => state.profile.Motor
  })
};
</script>

<style scoped>
</style>
