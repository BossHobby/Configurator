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
                      class="is-fullwidth"
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
                      class="is-fullwidth"
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
                                :min="rateLimits[currentMode][index].min"
                                :max="rateLimits[currentMode][index].max"
                                v-model.number="currentProfile.rate[index][0]"
                                @input="update()"
                              />
                            </div>
                            <div class="column is-4">
                              <input
                                class="input"
                                :id="`${currentModeText}-${rateLabel[index]}-pitch`"
                                type="number"
                                :step="rateStep[currentMode][index]"
                                :min="rateLimits[currentMode][index].min"
                                :max="rateLimits[currentMode][index].max"
                                v-model.number="currentProfile.rate[index][1]"
                                @input="update()"
                              />
                            </div>
                            <div class="column is-4">
                              <input
                                class="input"
                                :id="`${currentModeText}-${rateLabel[index]}-yaw`"
                                type="number"
                                :step="rateStep[currentMode][index]"
                                :min="rateLimits[currentMode][index].min"
                                :max="rateLimits[currentMode][index].max"
                                v-model.number="currentProfile.rate[index][2]"
                                @input="update()"
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
                <label class="label" for="sticks-deadband">
                  SticksDeadband
                  <tooltip entry="rate.sticks_deadband" />
                </label>
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

    <footer class="card-footer">
      <spinner-btn class="card-footer-item" @click="downloadRates">
        Save Rates
      </spinner-btn>
      <spinner-btn class="card-footer-item" @click="uploadRates">
        Load Rates
      </spinner-btn>
    </footer>

    <input accept=".yaml" type="file" ref="file" style="display: none" />
    <a ref="downloadAnchor" target="_blank"></a>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import LineChart from "@/components/LineChart.vue";
import { useProfileStore } from "@/store/profile";
import type { vec3_t } from "@/store/serial/types";
import YAML from "yaml";

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
    fileRef(): HTMLInputElement {
      return this.$refs.file as HTMLInputElement;
    },
    downloadAnchorRef(): HTMLAnchorElement {
      return this.$refs.downloadAnchor as HTMLAnchorElement;
    },

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
          JSON.stringify(
            this.profile.rate.rates[this.profile.rate.profile].rate
          )
        );
        this.profile.rate.rates[this.profile.rate.profile].mode = val;

        const copy = [...(this.rateBackup[val] || this.rateDefaults[val])];
        this.profile.rate.rates[this.profile.rate.profile].rate =
          copy as vec3_t[];
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
      rateLimits: [
        [
          { min: 0, max: 1800.0 },
          { min: 0, max: 1.0 },
          { min: 0, max: 1.0 },
        ],
        [
          { min: 0, max: 3.0 },
          { min: 0, max: 3.0 },
          { min: 0, max: 1.0 },
        ],
        [
          { min: 0, max: 500.0 },
          { min: 0, max: 1800.0 },
          { min: 0, max: 1.0 },
        ],
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
    constrain(val, lower, upper) {
      if (val > upper) return upper;
      if (val < lower) return lower;
      return val;
    },
    calcSilverware(axis: number, rc: number) {
      const expo = this.currentProfile.rate[this.SILVERWARE_ACRO_EXPO][axis];
      const maxRate = this.currentProfile.rate[this.SILVERWARE_MAX_RATE][axis];
      const rate_expo = rc * rc * rc * expo + rc * (1 - expo);
      return rate_expo * maxRate;
    },
    calcBetatflight(axis: number, rc: number) {
      const RC_RATE_INCREMENTAL = 14.54;
      const expo = this.currentProfile.rate[this.BETAFLIGHT_EXPO][axis];
      const rc_abs = Math.abs(rc);
      if (expo) {
        rc = rc * Math.pow(rc_abs, 3) * expo + rc * (1 - expo);
      }

      let rc_rate = this.currentProfile.rate[this.BETAFLIGHT_RC_RATE][axis];
      if (rc_rate > 2.0) {
        rc_rate += RC_RATE_INCREMENTAL * (rc_rate - 2.0);
      }

      let angle_rate = 200.0 * rc_rate * rc;

      const super_rate =
        this.currentProfile.rate[this.BETAFLIGHT_SUPER_RATE][axis];
      if (super_rate) {
        const super_factor =
          1.0 / this.constrain(1.0 - rc_abs * super_rate, 0.01, 1.0);
        angle_rate *= super_factor;
      }

      return angle_rate;
    },
    calcActual(axis: number, rc: number) {
      const expo = this.currentProfile.rate[this.ACTUAL_EXPO][axis];

      const rc_abs = Math.abs(rc);
      const rate_expo = rc_abs * (Math.pow(rc, 5) * expo + rc * (1 - expo));

      const center_sensitivity =
        this.currentProfile.rate[this.ACTUAL_CENTER_SENSITIVITY][axis];
      const max_rate = this.currentProfile.rate[this.ACTUAL_MAX_RATE][axis];
      const stick_movement = Math.max(0, max_rate - center_sensitivity);

      return rc * center_sensitivity + stick_movement * rate_expo;
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
    uploadRates() {
      const reader = new FileReader();
      reader.addEventListener("load", (event) => {
        if (event?.target?.result) {
          const rates = YAML.parse(event?.target?.result as string);
          this.profile.rate.rates = [...rates];
        }
      });

      this.fileRef.oninput = () => {
        if (!this.fileRef?.files?.length) {
          return;
        }
        reader.readAsText(this.fileRef.files[0]);
      };

      this.fileRef.click();
    },
    downloadRates() {
      const rates = YAML.stringify(this.profile.rate.rates);
      const encoded = encodeURIComponent(rates);
      const yaml = "data:text/yaml;charset=utf-8," + encoded;

      const date = new Date().toISOString().substring(0, 10);
      const name = this.profile.meta.name.replace(/\0/g, "");
      const filename = `Rates_${name}_${date}.yaml`;

      this.downloadAnchorRef.setAttribute("href", yaml);
      this.downloadAnchorRef.setAttribute("download", filename);
      this.downloadAnchorRef.click();
    },
  },
  mounted() {
    this.update();
  },
});
</script>

<style scoped></style>
