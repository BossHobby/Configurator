<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Rates</p>
    </header>

    <div class="card-content">
      <div class="content column-narrow field-is-5">
        <div class="columns">
          <div class="column is-6">
            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label" for="profile">
                  Profile
                  <tooltip entry="rate.profile" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      id="profile"
                      v-model.number="profile.rate.profile"
                      :options="rateProfiles"
                      @change="update()"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label" for="rate-mode">
                  Mode
                  <tooltip entry="rate.mode" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      id="rate-mode"
                      v-model.number="currentMode"
                      :options="rateModes"
                      @change="update()"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>

            <div class="card mt-5 mb-6">
              <header class="card-header">
                <p class="card-header-title">
                  {{ currentModeText }}
                </p>
              </header>

              <div class="card-content">
                <div class="content">
                  <div class="columns is-multiline">
                    <div class="column is-offset-4 is-8">
                      <div class="columns is-multiline">
                        <div class="column is-4">
                          <h6>Roll</h6>
                        </div>
                        <div class="column is-4">
                          <h6>Pitch</h6>
                        </div>
                        <div class="column is-4">
                          <h6>Yaw</h6>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    class="columns is-multiline"
                    v-for="(val, index) in currentProfile.rate"
                    :key="rateLabel[index]"
                  >
                    <div class="column is-4">
                      <label :for="`${currentModeText}-${rateLabel[index]}`">{{
                        rateLabel[index]
                      }}</label>
                    </div>
                    <div class="field-body">
                      <div class="field">
                        <div class="control is-expanded">
                          <div class="columns is-multiline">
                            <div class="column is-4">
                              <input
                                class="input"
                                :id="`${currentModeText}-${rateLabel[index]}-roll`"
                                type="number"
                                :step="rateStep[currentMode][index]"
                                v-model.number="currentProfile.rate[index][0]"
                                @update="update()"
                              />
                            </div>
                            <div class="column is-4">
                              <input
                                class="input"
                                :id="`${currentModeText}-${rateLabel[index]}-pitch`"
                                type="number"
                                :step="rateStep[currentMode][index]"
                                v-model.number="currentProfile.rate[index][1]"
                                @update="update()"
                              />
                            </div>
                            <div class="column is-4">
                              <input
                                class="input"
                                :id="`${currentModeText}-${rateLabel[index]}-yaw`"
                                type="number"
                                :step="rateStep[currentMode][index]"
                                v-model.number="currentProfile.rate[index][2]"
                                @update="update()"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label" for="level-max-angle">
                  LevelMaxAngle
                  <tooltip entry="rate.level_max_angle" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      class="input"
                      id="level-max-angle"
                      type="number"
                      step="5"
                      v-model.number="profile.rate.level_max_angle"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label" for="sticks-deadband">SticksDeadband</label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      class="input"
                      step="0.01"
                      id="sticks-deadband"
                      type="number"
                      v-model.number="profile.rate.sticks_deadband"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="column is-6">
            <LineChart
              :title="'Rates'"
              :labels="plot.labels"
              :axis="plot.axis"
            ></LineChart>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import LineChart from "@/components/LineChart.vue";
import { useProfileStore } from "@/store/profile";
import type { vec3_t } from "@/store/serial/types";

export default defineComponent({
  name: "StickRates",
  components: {
    LineChart,
  },
  setup() {
    return {
      profile: useProfileStore(),
    };
  },
  computed: {
    currentProfile() {
      return this.profile.rate.rates[this.profile.rate.profile];
    },
    currentMode: {
      get() {
        return this.currentProfile.mode;
      },
      set(val) {
        const oldMode = this.profile.rate.rates[this.profile.rate.profile].mode;
        this.rateBackup[oldMode] = JSON.parse(
          JSON.stringify(this.profile.rate.rates[this.profile.rate.profile].rate)
        );
        this.profile.rate.rates[this.profile.rate.profile].mode = val;

        const copy = [...(this.rateBackup[val] || this.rateDefaults[val])];
        this.profile.rate.rates[this.profile.rate.profile].rate = copy as vec3_t[];
      },
    },
    currentModeText() {
      return this.rateModes[this.currentProfile.mode].text;
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
          [70, 70, 70],
          [670, 670, 670],
          [0.0, 0.0, 0.0],
        ],
      ],
      rateStep: [
        [5, 0.05, 0.05],
        [0.05, 0.05, 0.05],
        [5, 5, 0.05],
      ],

      rateModes: [
        { value: 0, text: "Silverware" },
        { value: 1, text: "Betaflight" },
        { value: 2, text: "Actual" },
      ],
      plot: {
        axis: [] as any[],
        labels: [] as any[],
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
      let result = 0;

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

      let rcRate = this.currentProfile.rate[this.BETAFLIGHT_RC_RATE][axis];
      if (rcRate > 2.0) {
        rcRate += RC_RATE_INCREMENTAL * (rcRate - 2.0);
      }
      const rcCommandfAbs = val > 0 ? val : -val;
      let angleRate = 200.0 * rcRate * val;

      const superExpo = this.currentProfile.rate[this.BETAFLIGHT_SUPER_RATE][axis];
      if (superExpo) {
        const rcSuperfactor =
          1.0 / this.constrainf(1.0 - rcCommandfAbs * superExpo, 0.01, 1.0);
        angleRate *= rcSuperfactor;
      }
      return this.constrainf(angleRate, -SETPOINT_RATE_LIMIT, SETPOINT_RATE_LIMIT);
    },
    calcActual(axis, val) {
      const expo = this.currentProfile.rate[this.ACTUAL_EXPO][axis];
      const rate_expo = this.rcexpo(val, expo);

      const center_sensitivity = this.currentProfile.rate[this.ACTUAL_CENTER_SENSITIVITY][
        axis
      ];
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
          data: [] as any[],
        },
        {
          label: "Pitch",
          data: [] as any[],
        },
        {
          label: "Yaw",
          data: [] as any[],
        },
      ];

      const labels = [] as string[];

      for (let i = -100; i <= 100; i++) {
        const input = i / 100.0;

        labels.push("" + i.toString());

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
});
</script>

<style scoped></style>
