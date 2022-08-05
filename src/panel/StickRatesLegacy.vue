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
                      class="is-fullwidth"
                      v-model.number="profile.rate.mode"
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
                  {{ currentMode.text }}
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
                    v-for="(val, key) in profile.rate[
                      currentMode.text.toLowerCase()
                    ]"
                    :key="key"
                  >
                    <div class="column is-4">
                      <label :for="`${currentMode.text}-${key}`">
                        {{ key }}
                      </label>
                    </div>
                    <div class="field-body">
                      <div class="field">
                        <div class="control is-expanded">
                          <div class="columns is-multiline">
                            <div class="column is-4">
                              <input
                                class="input"
                                :id="`${currentMode.text}-${key}-roll`"
                                type="number"
                                step="10"
                                v-model.number="
                                  profile.rate[currentMode.text.toLowerCase()][
                                    key
                                  ][0]
                                "
                              />
                            </div>
                            <div class="column is-4">
                              <input
                                class="input"
                                :id="`${currentMode.text}-${key}-pitch`"
                                type="number"
                                step="10"
                                v-model.number="
                                  profile.rate[currentMode.text.toLowerCase()][
                                    key
                                  ][1]
                                "
                              />
                            </div>
                            <div class="column is-4">
                              <input
                                class="input"
                                :id="`${currentMode.text}-${key}-yaw`"
                                type="number"
                                step="10"
                                v-model.number="
                                  profile.rate[currentMode.text.toLowerCase()][
                                    key
                                  ][2]
                                "
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
                <label class="label" for="low-rate-mulitplier">
                  LowRateMulitplier
                  <tooltip entry="rate.low_rate_mulitplier" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      class="input"
                      id="low-rate-mulitplier"
                      type="number"
                      step="0.05"
                      v-model.number="profile.rate.low_rate_mulitplier"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label" for="sticks-deadband"
                  >SticksDeadband</label
                >
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
              v-if="profile.rate.silverware.acro_expo"
              :title="(plotLowRates ? 'Low ' : '') + 'Rates'"
              :labels="plot.labels"
              :axis="plot.axis"
            ></LineChart>
            <input
              id="plotLowRates"
              name="plotLowRates"
              type="checkbox"
              class="switch"
              v-model="plotLowRates"
            />
            <label for="plotLowRates">Plot LowRates</label>
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

export default defineComponent({
  name: "StickRatesLegacy",
  components: {
    LineChart,
  },
  setup() {
    return {
      profile: useProfileStore(),
    };
  },
  data() {
    return {
      plotLowRates: false,
      rateModes: [
        { value: 0, text: "Silverware" },
        { value: 1, text: "Betaflight" },
      ],
      plot: {
        axis: [] as any[],
        labels: [] as any[],
      },
    };
  },

  computed: {
    currentMode() {
      return this.rateModes[this.profile.rate.mode];
    },
  },

  watch: {
    "profile.rate": {
      handler(val) {
        this.update();
      },
      deep: true,
    },
    plotLowRates() {
      this.update();
    },
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
      const expo = this.profile.rate.silverware.acro_expo[axis];
      const maxRate = this.profile.rate.silverware.max_rate[axis];
      return this.rcexpo(val, expo) * maxRate;
    },
    calcBetatflight(axis, val) {
      const SETPOINT_RATE_LIMIT = 1998.0;
      const RC_RATE_INCREMENTAL = 14.54;

      const expo = this.profile.rate.betaflight.expo[axis];
      val = this.rcexpo(val, expo);

      let rcRate = this.profile.rate.betaflight.rc_rate[axis];
      if (rcRate > 2.0) {
        rcRate += RC_RATE_INCREMENTAL * (rcRate - 2.0);
      }
      const rcCommandfAbs = val > 0 ? val : -val;
      let angleRate = 200.0 * rcRate * val;

      const superExpo = this.profile.rate.betaflight.super_rate[axis];
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

      const rateMulit = this.plotLowRates
        ? this.profile.rate.low_rate_mulitplier
        : 1.0;
      for (let i = -100; i <= 100; i++) {
        const input = i / 100.0;

        labels.push("" + i);

        for (let j = 0; j < 3; j++) {
          if (this.currentMode.text == "Silverware") {
            axis[j].data.push({
              x: i,
              y: this.calcSilverware(j, input) * rateMulit,
            });
          } else if (this.currentMode.text == "Betaflight") {
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
