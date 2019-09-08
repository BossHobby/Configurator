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
