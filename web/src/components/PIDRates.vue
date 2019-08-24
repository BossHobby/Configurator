<template>
  <b-card>
    <h5 slot="header" class="mb-0">PID</h5>
    <b-row>
      <b-col offset="4" sm="8">
        <b-row>
          <b-col sm="4">
            <h6>Roll</h6>
          </b-col>
          <b-col sm="4">
            <h6>Pitch</h6>
          </b-col>
          <b-col sm="4">
            <h6>Yaw</h6>
          </b-col>
        </b-row>
      </b-col>
    </b-row>

    <b-row v-for="(val, key) in PID" :key="key">
      <b-col sm="4">
        <label :for="`pid-${key}`">{{ key }}</label>
      </b-col>
      <b-col sm="8">
        <b-row>
          <b-col sm="4">
            <b-form-input
              :id="`pid-${key}-roll`"
              type="number"
              step="0.01"
              v-model.number="PID[key][0]"
            ></b-form-input>
          </b-col>
          <b-col sm="4">
            <b-form-input
              :id="`pid-${key}-pitch`"
              type="number"
              step="0.01"
              v-model.number="PID[key][1]"
            ></b-form-input>
          </b-col>
          <b-col sm="4">
            <b-form-input
              :id="`pid-${key}-yaw`"
              type="number"
              step="0.01"
              v-model.number="PID[key][2]"
            ></b-form-input>
          </b-col>
        </b-row>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "PIDPIDs",
  computed: mapState({
    PID: state => state.profile.PID
  })
};
</script>

<style scoped>
</style>
