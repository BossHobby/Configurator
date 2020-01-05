<template>
  <b-card>
    <h5 slot="header" class="mb-0">PID</h5>

    <b-row>
      <b-col sm="6">
        <b-row class="my-2">
          <b-col sm="4" class="my-2">
            <label for="pid-preset">PID Preset</label>
          </b-col>
          <b-col sm="6" class="my-2">
            <b-form-select id="pid-preset" v-model.number="current_preset" :options="presets"></b-form-select>
          </b-col>
          <b-col sm="2" class="my-2">
            <b-button v-on:click="load_preset(current_preset)">Load</b-button>
          </b-col>
        </b-row>
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
                  step="1.0"
                  v-model.number="pid_rates[key][0]"
                ></b-form-input>
              </b-col>
              <b-col sm="4">
                <b-form-input
                  :id="`pid-${key}-pitch`"
                  type="number"
                  step="1.0"
                  v-model.number="pid_rates[key][1]"
                ></b-form-input>
              </b-col>
              <b-col sm="4">
                <b-form-input
                  :id="`pid-${key}-yaw`"
                  type="number"
                  step="1.0"
                  v-model.number="pid_rates[key][2]"
                ></b-form-input>
              </b-col>
            </b-row>
          </b-col>
        </b-row>

        <b-row class="mt-4">
          <b-col sm="4" class="my-2">
            <label for="throttle_dterm_attenuation-enable">Throttle DTerm Attenuation</label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-select
              id="throttle_dterm_attenuation-enable"
              v-model.number="pid.throttle_dterm_attenuation.tda_active"
              :options="tdaOptions"
            ></b-form-select>
          </b-col>
        </b-row>
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="throttle_dterm_attenuation-breakpoint">TDA Breakpoint</label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-input
              id="throttle_dterm_attenuation-breakpoint"
              type="number"
              step="0.05"
              v-model.number="pid.throttle_dterm_attenuation.tda_breakpoint"
            ></b-form-input>
          </b-col>
        </b-row>
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="throttle_dterm_attenuation-percent">TDA Percent</label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-input
              id="throttle_dterm_attenuation-percent"
              type="number"
              step="0.05"
              v-model.number="pid.throttle_dterm_attenuation.tda_percent"
            ></b-form-input>
          </b-col>
        </b-row>
      </b-col>
      <b-col sm="6">
        <b-row class="mt-2">
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

        <b-row class="mt-4">
          <b-col sm="4" class="my-2">Angle PID</b-col>
        </b-row>
        <b-row class="mt-3">
          <b-col offset="4" sm="8">
            <b-row>
              <b-col sm="6">
                <h6>Small</h6>
              </b-col>
              <b-col sm="6">
                <h6>Big</h6>
              </b-col>
            </b-row>
          </b-col>
        </b-row>

        <b-row v-for="(key, index) in ['kp', 'kd']" :key="index">
          <b-col sm="4">
            <label :for="`stick-${key}`">{{ key }}</label>
          </b-col>
          <b-col sm="8">
            <b-row>
              <b-col sm="6">
                <b-form-input
                  :id="`small-angle-${key}`"
                  type="number"
                  step="0.01"
                  v-model.number="pid.small_angle[key]"
                ></b-form-input>
              </b-col>
              <b-col sm="6">
                <b-form-input
                  :id="`big-angle-${key}`"
                  type="number"
                  step="0.01"
                  v-model.number="pid.big_angle[key]"
                ></b-form-input>
              </b-col>
            </b-row>
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
      ],
      tdaOptions: [
        { value: 0, text: "None" },
        { value: 1, text: "Active" },
        { value: 2, text: "Max" }
      ],
      current_preset: 0
    };
  },
  computed: {
    ...mapState({
      pid: state => state.profile.pid,
      pid_rate_presets: state => state.pid_rate_presets,
      pid_profile: state => state.profile.pid.pid_profile,
      stick_profile: state => state.profile.pid.stick_profile,
      stick_rates: state =>
        state.profile.pid.stick_rates[state.profile.pid.stick_profile]
    }),
    pid_rates: {
      get() {
        return this.$store.getters.current_pid_rate;
      },
      set(value) {
        this.$store.commit("set_current_pid_rate", value);
      }
    },
    presets() {
      return this.pid_rate_presets.map(p => {
        return {
          value: p.index,
          text: p.name
        };
      });
    }
  },
  methods: {
    load_preset(index) {
      this.pid_rates = this.pid_rate_presets[index].rate;
    }
  }
};
</script>

<style scoped>
</style>
