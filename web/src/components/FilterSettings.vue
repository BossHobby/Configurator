<template>
  <b-card>
    <h5 slot="header" class="mb-0">Filter</h5>
    <b-row v-if="profile.filter">
      <b-col sm="6" v-if="profile.filter.gyro">
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="gyro-1-type">Gyro Slot 1 Type</label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-select
              id="gyro-1-type"
              v-model.number="profile.filter.gyro[0].type"
              :options="filterTypeOptions"
            ></b-form-select>
          </b-col>
        </b-row>
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="gyro-1-freq">Gyro Slot 1 Freq</label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-input
              id="gyro-1-freq"
              type="number"
              step="5"
              v-model.number="profile.filter.gyro[0].cutoff_freq"
            ></b-form-input>
          </b-col>
        </b-row>
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="gyro-2-type">Gyro Slot 2 Type</label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-select
              id="gyro-2-type"
              v-model.number="profile.filter.gyro[1].type"
              :options="filterTypeOptions"
            ></b-form-select>
          </b-col>
        </b-row>
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="gyro-2-freq">Gyro Slot 2 Freq</label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-input
              id="gyro-2-freq"
              type="number"
              step="5"
              v-model.number="profile.filter.gyro[1].cutoff_freq"
            ></b-form-input>
          </b-col>
        </b-row>
      </b-col>

      <b-col sm="6" v-if="profile.filter.dterm">
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="dterm-1-type">DTerm Slot 1 Type</label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-select
              id="dterm-1-type"
              v-model.number="profile.filter.dterm[0].type"
              :options="filterTypeOptions"
            ></b-form-select>
          </b-col>
        </b-row>
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="dterm-1-freq">DTerm Slot 1 Freq</label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-input
              id="dterm-1-freq"
              type="number"
              step="5"
              v-model.number="profile.filter.dterm[0].cutoff_freq"
            ></b-form-input>
          </b-col>
        </b-row>
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="dterm-2-type">DTerm Slot 2 Type</label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-select
              id="dterm-2-type"
              v-model.number="profile.filter.dterm[1].type"
              :options="filterTypeOptions"
            ></b-form-select>
          </b-col>
        </b-row>
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="dterm-2-freq">DTerm Slot 2 Freq</label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-input
              id="dterm-2-freq"
              type="number"
              step="5"
              v-model.number="profile.filter.dterm[1].cutoff_freq"
            ></b-form-input>
          </b-col>
        </b-row>

        <b-row>
          <b-col sm="4" class="my-2">
            <label for="dterm-dynamic-enable">DTerm Dynamic</label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-select
              id="dterm-dynamic-enable"
              v-model.number="profile.filter.dterm_dynamic_enable"
              :options="toggleOptions"
            ></b-form-select>
          </b-col>
        </b-row>
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="dterm-dynamic-min">DTerm Dynamic Min</label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-input
              id="dterm-dynamic-min"
              type="number"
              step="5"
              v-model.number="profile.filter.dterm_dynamic_min"
            ></b-form-input>
          </b-col>
        </b-row>
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="dterm-dynamic-max">DTerm Dynamic Max</label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-input
              id="dterm-dynamic-max"
              type="number"
              step="5"
              v-model.number="profile.filter.dterm_dynamic_max"
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
  name: "FilterSettings",
  data() {
    return {
      filterTypeOptions: [
        { value: 0, text: "None" },
        { value: 1, text: "PT1 1st Order" },
        { value: 1, text: "PT1 2nd Order" }
      ],
      toggleOptions: [{ value: 0, text: "Off" }, { value: 1, text: "On" }]
    };
  },
  computed: {
    ...mapState(["profile"])
  }
};
</script>
