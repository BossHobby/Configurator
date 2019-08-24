<template>
  <b-card>
    <h5 slot="header" class="mb-0">Setup</h5>
    <b-row>
      <b-col sm="4">
        <label for="invert-yaw">Invert Yaw</label>
      </b-col>
      <b-col sm="8">
        <b-form-select id="invert-yaw" v-model.number="Setup.InvertYaw" :options="invertYawModes"></b-form-select>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "Setup",
  data() {
    return {
      invertYawModes: [
        { value: 0, text: "Props In" },
        { value: 1, text: "Props Out" }
      ]
    };
  },
  computed: mapState({
    Setup: state => state.profile.Setup
  })
};
</script>

<style scoped>
</style>
