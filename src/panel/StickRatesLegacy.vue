<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Rates</p>
    </header>

    <div class="card-content">
      <div class="content">
        <div class="columns">
          <div class="column is-6">
            <div class="columns">
              <div class="column is-4">
                <label for="rate-mode">
                  Mode
                  <tooltip entry="rate.mode" />
                </label>
              </div>
              <div class="column is-8">
                <input-select
                  id="rate-mode"
                  v-model.number="rate.mode"
                  :options="rateModes"
                  @change="update()"
                ></input-select>
              </div>

              <div class="column is-12" v-for="mode in rateModes" :key="mode.text">
                <div class="card my-3" v-if="mode.value == rate.mode">
                  <header class="card-header">
                    <p class="card-header-title">
                      {{ mode.text }}
                    </p>
                  </header>

                  <div class="card-content">
                    <div class="content">
                      <div class="columns">
                        <div class="column is-8" offset="4">
                          <div class="columns">
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
                        class="columns"
                        v-for="(val, key) in rate[mode.text.toLowerCase()]"
                        :key="key"
                      >
                        <div class="column is-4">
                          <label :for="`${mode.text}-${key}`">{{ key }}</label>
                        </div>
                        <div class="column is-8">
                          <div class="columns">
                            <div class="column is-4">
                              <input
                                class="input"
                                :id="`${mode.text}-${key}-roll`"
                                type="number"
                                step="0.05"
                                v-model.number="rate[mode.text.toLowerCase()][key][0]"
                                @update="update()"
                              />
                            </div>
                            <div class="column is-4">
                              <input
                                class="input"
                                :id="`${mode.text}-${key}-pitch`"
                                type="number"
                                step="0.05"
                                v-model.number="rate[mode.text.toLowerCase()][key][1]"
                                @update="update()"
                              />
                            </div>
                            <div class="column is-4">
                              <input
                                class="input"
                                :id="`${mode.text}-${key}-yaw`"
                                type="number"
                                step="0.05"
                                v-model.number="rate[mode.text.toLowerCase()][key][2]"
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

              <div class="column is-4 my-2">
                <label for="level-max-angle">
                  LevelMaxAngle
                  <tooltip entry="rate.level_max_angle" />
                </label>
              </div>
              <div class="column is-8 my-2">
                <input
                  class="input"
                  id="level-max-angle"
                  type="number"
                  step="5"
                  v-model.number="rate.level_max_angle"
                />
              </div>

              <div class="column is-4 my-2">
                <label for="low-rate-mulitplier">
                  LowRateMulitplier
                  <tooltip entry="rate.low_rate_mulitplier" />
                </label>
              </div>
              <div class="column is-8 my-2">
                <input
                  class="input"
                  id="low-rate-mulitplier"
                  type="number"
                  v-model.number="rate.low_rate_mulitplier"
                  step="0.05"
                />
              </div>

              <div class="column is-4 my-2">
                <label for="sticks-deadband">
                  SticksDeadband
                  <tooltip entry="rate.sticks_deadband" />
                </label>
              </div>
              <div class="column is-8 my-2">
                <input
                  class="input"
                  step="0.01"
                  id="sticks-deadband"
                  type="number"
                  v-model.number="rate.sticks_deadband"
                />
              </div>
            </div>
          </div>
          <div class="column is-6">
            <LineChart
              v-if="rate.silverware.acro_expo"
              :title="(plotLowRates ? 'Low ' : '') + 'Rates'"
              :labels="plot.labels"
              :axis="plot.axis"
            ></LineChart>
            <b-form-checkbox v-model="plotLowRates">Plot LowRates</b-form-checkbox>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import LineChart from "@/components/LineChart.vue";
import { mapFields } from "@/store/helper.js";

export default defineComponent({
  name: "StickRatesLegacy",
  components: {
    LineChart,
  },
  computed: {
    ...mapFields("profile", ["rate"]),
    currentMode() {
      return this.rateModes[this.rate.mode].text;
    },
  },
  data() {
    return {
      plotLowRates: false,
      rateModes: [
        { value: 0, text: "Silverware" },
        { value: 1, text: "Betaflight" },
      ],
      plot: {
        axis: [],
        label: [],
      },
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
    rcexpo(val, exp) {
      if (exp > 1) exp = 1;

      if (exp < -1) exp = -1;

      const ans = val * val * val * exp + val * (1 - exp);
      return this.limitf(ans, 1.0);
    },
    calcSilverware(axis, val) {
      const expo = this.rate.silverware.acro_expo[axis];
      const maxRate = this.rate.silverware.max_rate[axis];
      return this.rcexpo(val, expo) * maxRate;
    },
    calcBetatflight(axis, val) {
      const SETPOINT_RATE_LIMIT = 1998.0;
      const RC_RATE_INCREMENTAL = 14.54;

      const expo = this.rate.betaflight.expo[axis];
      val = this.rcexpo(val, expo);

      var rcRate = this.rate.betaflight.rc_rate[axis];
      if (rcRate > 2.0) {
        rcRate += RC_RATE_INCREMENTAL * (rcRate - 2.0);
      }
      const rcCommandfAbs = val > 0 ? val : -val;
      var angleRate = 200.0 * rcRate * val;

      const superExpo = this.rate.betaflight.super_rate[axis];
      if (superExpo) {
        const rcSuperfactor =
          1.0 / this.constrainf(1.0 - rcCommandfAbs * superExpo, 0.01, 1.0);
        angleRate *= rcSuperfactor;
      }
      return this.constrainf(angleRate, -SETPOINT_RATE_LIMIT, SETPOINT_RATE_LIMIT);
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

      const rateMulit = this.plotLowRates ? this.rate.low_rate_mulitplier : 1.0;
      for (let i = -100; i <= 100; i++) {
        const input = i / 100.0;

        labels.push("" + i);

        for (let j = 0; j < 3; j++) {
          if (this.currentMode == "Silverware") {
            axis[j].data.push({
              x: i,
              y: this.calcSilverware(j, input) * rateMulit,
            });
          } else if (this.currentMode == "Betaflight") {
            axis[j].data.push({
              x: i,
              y: this.calcBetatflight(j, input) * rateMulit,
            });
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
