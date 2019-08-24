<template>
  <b-card>
    <h5 slot="header" class="mb-0">Rate</h5>
    <b-row>
      <b-col sm="4">
        <label for="rate-mode">Mode</label>
      </b-col>
      <b-col sm="8">
        <b-form-select id="rate-mode" v-model.number="Rate.Mode" :options="rateModes"></b-form-select>
      </b-col>

      <b-col sm="12" v-for="mode in rateModes" :key="mode.text">
        <b-card class="my-3" v-if="mode.value == Rate.Mode">
          <h6 slot="header" class="mb-0">{{mode.text}}</h6>

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

          <b-row v-for="(val, key) in Rate[mode.text]" :key="key">
            <b-col sm="4">
              <label :for="`${mode.text}-${key}`">{{ key }}</label>
            </b-col>
            <b-col sm="8">
              <b-row>
                <b-col sm="4">
                  <b-form-input
                    :id="`${mode.text}-${key}-roll`"
                    type="number"
                    step="0.05"
                    v-model.number="Rate[mode.text][key][0]"
                  ></b-form-input>
                </b-col>
                <b-col sm="4">
                  <b-form-input
                    :id="`${mode.text}-${key}-pitch`"
                    type="number"
                    step="0.05"
                    v-model.number="Rate[mode.text][key][1]"
                  ></b-form-input>
                </b-col>
                <b-col sm="4">
                  <b-form-input
                    :id="`${mode.text}-${key}-yaw`"
                    type="number"
                    step="0.05"
                    v-model.number="Rate[mode.text][key][2]"
                  ></b-form-input>
                </b-col>
              </b-row>
            </b-col>
          </b-row>
        </b-card>
      </b-col>

      <b-col sm="4" class="my-2">
        <label for="level-max-angle">LevelMaxAngle</label>
      </b-col>
      <b-col sm="8" class="my-2">
        <b-form-input
          id="level-max-angle"
          type="number"
          step="5"
          v-model.number="Rate.LevelMaxAngle"
        ></b-form-input>
      </b-col>

      <b-col sm="4" class="my-2">
        <label for="low-rate-mulitplier">LowRateMulitplier</label>
      </b-col>
      <b-col sm="8" class="my-2">
        <b-form-input
          id="low-rate-mulitplier"
          type="number"
          v-model.number="Rate.LowRateMulitplier"
          step="0.05"
        ></b-form-input>
      </b-col>

      <b-col sm="4" class="my-2">
        <label for="sticks-deadband">SticksDeadband</label>
      </b-col>
      <b-col sm="8" class="my-2">
        <b-form-input
          step="0.01"
          id="sticks-deadband"
          type="number"
          v-model.number="Rate.SticksDeadband"
        ></b-form-input>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "Rate",
  computed: mapState({
    Rate: state => state.profile.Rate
  }),
  data() {
    return {
      rateModes: [
        { value: 0, text: "Silverware" },
        { value: 1, text: "Betaflight" }
      ]
    };
  }
};
</script>

<style scoped>
</style>
