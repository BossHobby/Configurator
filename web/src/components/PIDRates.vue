<template>
  <b-card>
    <h5 slot="header" class="mb-0">PID</h5>
    <b-row>
      <b-col sm="4" class="my-2">
        <label for="pid-profile">PIDProfile</label>
      </b-col>
      <b-col sm="8" class="my-2">
        <b-form-select id="pid-profile" v-model.number="pid.pid_profile" :options="pidProfiles"></b-form-select>
      </b-col>
    </b-row>
    <b-row class="mt-3">
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

    <b-row v-for="(val, key) in pid_rates" :key="key">
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
              v-model.number="pid_rates[key][0]"
            ></b-form-input>
          </b-col>
          <b-col sm="4">
            <b-form-input
              :id="`pid-${key}-pitch`"
              type="number"
              step="0.01"
              v-model.number="pid_rates[key][1]"
            ></b-form-input>
          </b-col>
          <b-col sm="4">
            <b-form-input
              :id="`pid-${key}-yaw`"
              type="number"
              step="0.01"
              v-model.number="pid_rates[key][2]"
            ></b-form-input>
          </b-col>
        </b-row>
      </b-col>
    </b-row>
    <b-row class="mt-4">
      <b-col sm="4" class="my-2">
        <label for="stick-profile">Stick Boost Profile</label>
      </b-col>
      <b-col sm="8" class="my-2">
        <b-form-select
          id="stick-profile"
          v-model.number="pid.stick_profile"
          :options="stickProfiles"
        ></b-form-select>
      </b-col>
    </b-row>
    <b-row class="mt-3">
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

    <b-row v-for="(val, key) in stick_rates" :key="key">
      <b-col sm="4">
        <label :for="`stick-${key}`">{{ key }}</label>
      </b-col>
      <b-col sm="8">
        <b-row>
          <b-col sm="4">
            <b-form-input
              :id="`stick-${key}-roll`"
              type="number"
              step="0.01"
              v-model.number="stick_rates[key][0]"
            ></b-form-input>
          </b-col>
          <b-col sm="4">
            <b-form-input
              :id="`stick-${key}-pitch`"
              type="number"
              step="0.01"
              v-model.number="stick_rates[key][1]"
            ></b-form-input>
          </b-col>
          <b-col sm="4">
            <b-form-input
              :id="`stick-${key}-yaw`"
              type="number"
              step="0.01"
              v-model.number="stick_rates[key][2]"
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
  name: "PIDRates",
  data() {
    return {
      pidProfiles: [
        { value: 0, text: "PID Profile 1" },
        { value: 1, text: "PID Profile 2" }
      ],
      stickProfiles: [
        { value: 0, text: "Stick Boost Profile AUX Off" },
        { value: 1, text: "Stick Boost Profile AUX On" }
      ]
    };
  },
  computed: mapState({
    pid: state => state.profile.pid,
    pid_profile: state => state.profile.pid.pid_profile,
    pid_rates: state =>
      state.profile.pid.pid_rates[state.profile.pid.pid_profile],
    stick_profile: state => state.profile.pid.stick_profile,
    stick_rates: state =>
      state.profile.pid.stick_rates[state.profile.pid.stick_profile]
  })
};
</script>

<style scoped>
</style>
