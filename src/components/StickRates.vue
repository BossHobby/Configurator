<template>
  <b-card>
    <h5 slot="header" class="mb-0">Rates</h5>
    <b-row>
      <b-col sm="6">
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="profile">
              Profile
              <tooltip entry="rate.profile" />
            </label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-select
              id="profile"
              v-model.number="rate.profile"
              :options="rateProfiles"
              @change="update()"
            ></b-form-select>
          </b-col>

          <b-col sm="4" class="my-2">
            <label for="rate-mode">
              Mode
              <tooltip entry="rate.mode" />
            </label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-select
              id="rate-mode"
              v-model.number="currentMode"
              :options="rateModes"
              @change="update()"
            ></b-form-select>
          </b-col>

          <b-col sm="12">
            <b-card class="my-3">
              <h6 slot="header" class="mb-0">{{ currentModeText }}</h6>
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
              <b-row
                v-for="(val, index) in currentProfile.rate"
                :key="rateLabel[index]"
              >
                <b-col sm="4">
                  <label :for="`${currentModeText}-${rateLabel[index]}`">{{
                    rateLabel[index]
                  }}</label>
                </b-col>
                <b-col sm="8">
                  <b-row>
                    <b-col sm="4">
                      <b-form-input
                        :id="`${currentModeText}-${rateLabel[index]}-roll`"
                        type="number"
                        step="0.05"
                        v-model.number="currentProfile.rate[index][0]"
                        @update="update()"
                      ></b-form-input>
                    </b-col>
                    <b-col sm="4">
                      <b-form-input
                        :id="`${currentModeText}-${rateLabel[index]}-pitch`"
                        type="number"
                        step="0.05"
                        v-model.number="currentProfile.rate[index][1]"
                        @update="update()"
                      ></b-form-input>
                    </b-col>
                    <b-col sm="4">
                      <b-form-input
                        :id="`${currentModeText}-${rateLabel[index]}-yaw`"
                        type="number"
                        step="0.05"
                        v-model.number="currentProfile.rate[index][2]"
                        @update="update()"
                      ></b-form-input>
                    </b-col>
                  </b-row>
                </b-col>
              </b-row>
            </b-card>
          </b-col>

          <b-col sm="4" class="my-2">
            <label for="level-max-angle">
              LevelMaxAngle
              <tooltip entry="rate.level_max_angle" />
            </label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-input
              id="level-max-angle"
              type="number"
              step="5"
              v-model.number="rate.level_max_angle"
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
              v-model.number="rate.sticks_deadband"
            ></b-form-input>
          </b-col>
        </b-row>
      </b-col>
      <b-col sm="6">
        <LineChart
          :title="'Rates'"
          :labels="plot.labels"
          :axis="plot.axis"
        ></LineChart>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import LineChart from "@/components/LineChart";
import { mapFields } from "@/store/helper.js";

export default {
  name: "StickRates",
  components: {
    LineChart,
  },
  computed: {
    ...mapFields("profile", ["rate"]),
    currentProfile() {
      return this.rate.rates[this.rate.profile];
    },
    currentMode: {
      get() {
        return this.currentProfile.mode;
      },
      set(val) {
        const oldMode = this.rate.rates[this.rate.profile].mode;
        this.rateBackup[oldMode] = JSON.parse(
          JSON.stringify(this.rate.rates[this.rate.profile].rate)
        );
        this.rate.rates[this.rate.profile].mode = val;

        const copy = [...(this.rateBackup[val] || this.rateDefaults[val])];
        this.rate.rates[this.rate.profile].rate = copy;
      },
    },
    currentModeText() {
      return this.rateModes[this.currentProfile.mode].text;
    },
    rateMap() {
      return this.rateMappings[this.currentProfile.mode];
    },
    rateLabel() {
      return this.rateLabels[this.currentProfile.mode];
    },
  },
  data() {
    return {
      rateProfiles: [
        { value: 0, text: "Rate Profile 1" },
        { value: 1, text: "Rate Profile 2" },
      ],

      MODE_SILVERWARE: 0,
      MODE_BETAFLIGHT: 1,
      MODE_ACTUAL: 2,

      rateBackup: {},
      rateDefaults: [
        [
          [860, 860, 500],
          [0.8, 0.8, 0.6],
          [0.55, 0.0, 0.55],
        ],
        [
          [1.3, 1.3, 1.3],
          [0.7, 0.7, 0.7],
          [0.4, 0.4, 0.4],
        ],
        [
          [250, 250, 250],
          [860, 860, 860],
          [0.5, 0.5, 0.5],
        ],
      ],

      rateModes: [
        { value: 0, text: "Silverware" },
        { value: 1, text: "Betaflight" },
        { value: 2, text: "Actual" },
      ],
      plot: {
        axis: [],
        label: [],
      },

      SILVERWARE_MAX_RATE: 0,
      SILVERWARE_ACRO_EXPO: 1,
      SILVERWARE_ANGLE_EXPO: 2,

      BETAFLIGHT_RC_RATE: 0,
      BETAFLIGHT_SUPER_RATE: 1,
      BETAFLIGHT_EXPO: 2,

      ACTUAL_CENTER_SENSITIVITY: 0,
      ACTUAL_MAX_RATE: 1,
      ACTUAL_EXPO: 2,

      rateLabels: [
        ["MAX_RATE", "ACRO_EXPO", "ANGLE_EXPO"],
        ["RC_RATE", "SUPER_RATE", "EXPO"],
        ["CENTER_SENSITIVITY", "MAX_RATE", "EXPO"],
      ],
    };
  },
  methods: {
    constrainf(val, lower, upper) {
      if (val > upper) return upper;
      if (val < lower) return lower;
      return val;
    },
    limitf(val, limit) {
      return this.constrainf(val, -limit, limit);
    },
    rcexpo(rc, expo) {
      expo = this.limitf(expo, 1.0);
      var result = 0;

      switch (this.currentProfile.mode) {
        case this.MODE_SILVERWARE:
          result = rc * rc * rc * expo + rc * (1 - expo);
          break;
        case this.MODE_BETAFLIGHT:
          result = Math.abs(rc) * rc * rc * rc * expo + rc * (1 - expo);
          break;
        case this.MODE_ACTUAL:
          result = Math.abs(rc) * (Math.pow(rc, 5) * expo + rc * (1 - expo));
          break;
      }

      return this.limitf(result, 1.0);
    },
    calcSilverware(axis, val) {
      const expo = this.currentProfile.rate[this.SILVERWARE_ACRO_EXPO][axis];
      const maxRate = this.currentProfile.rate[this.SILVERWARE_MAX_RATE][axis];
      return this.rcexpo(val, expo) * maxRate;
    },
    calcBetatflight(axis, val) {
      const SETPOINT_RATE_LIMIT = 1998.0;
      const RC_RATE_INCREMENTAL = 14.54;

      const expo = this.currentProfile.rate[this.BETAFLIGHT_EXPO][axis];
      val = this.rcexpo(val, expo);

      var rcRate = this.currentProfile.rate[this.BETAFLIGHT_RC_RATE][axis];
      if (rcRate > 2.0) {
        rcRate += RC_RATE_INCREMENTAL * (rcRate - 2.0);
      }
      const rcCommandfAbs = val > 0 ? val : -val;
      var angleRate = 200.0 * rcRate * val;

      const superExpo =
        this.currentProfile.rate[this.BETAFLIGHT_SUPER_RATE][axis];
      if (superExpo) {
        const rcSuperfactor =
          1.0 / this.constrainf(1.0 - rcCommandfAbs * superExpo, 0.01, 1.0);
        angleRate *= rcSuperfactor;
      }
      return this.constrainf(
        angleRate,
        -SETPOINT_RATE_LIMIT,
        SETPOINT_RATE_LIMIT
      );
    },
    calcActual(axis, val) {
      const expo = this.currentProfile.rate[this.ACTUAL_EXPO][axis];
      const rate_expo = this.rcexpo(val, expo);

      const center_sensitivity =
        this.currentProfile.rate[this.ACTUAL_CENTER_SENSITIVITY][axis];
      const max_rate = this.currentProfile.rate[this.ACTUAL_MAX_RATE][axis];

      let stick_movement = max_rate - center_sensitivity;
      if (stick_movement < 0) {
        stick_movement = 0;
      }

      return val * center_sensitivity + stick_movement * rate_expo;
    },
    update() {
      const axis = [
        {
          label: "Roll",
          data: [],
        },
        {
          label: "Pitch",
          data: [],
        },
        {
          label: "Yaw",
          data: [],
        },
      ];

      const labels = [];

      for (let i = -100; i <= 100; i++) {
        const input = i / 100.0;

        labels.push("" + i);

        for (let j = 0; j < 3; j++) {
          switch (this.currentProfile.mode) {
            case this.MODE_SILVERWARE:
              axis[j].data.push({
                x: i,
                y: this.calcSilverware(j, input),
              });
              break;

            case this.MODE_BETAFLIGHT:
              axis[j].data.push({
                x: i,
                y: this.calcBetatflight(j, input),
              });
              break;

            case this.MODE_ACTUAL:
              axis[j].data.push({
                x: i,
                y: this.calcActual(j, input),
              });
              break;
          }
        }
      }

      this.plot = {
        labels,
        axis,
      };
    },
  },
  mounted() {
    this.update();
  },
};
</script>

<style scoped>
</style>
