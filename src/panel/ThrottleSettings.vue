<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Throttle Settings</p>
    </header>

    <div class="card-content">
      <div v-if="info.is_rover" class="content column-narrow field-is-5">
        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label" for="rover-throttle-scale-breakpoint"
              >Throttle Scale Breakpoint (%)</label
            >
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  id="rover-throttle-scale-breakpoint"
                  v-model.number="throttleScaleBreakpointPct"
                  class="input"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label" for="rover-throttle-scale-factor"
              >Throttle Scale Factor (%)</label
            >
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  id="rover-throttle-scale-factor"
                  v-model.number="throttleScaleFactorPct"
                  class="input"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="content">
        <div class="columns column-narrow field-is-5">
          <div class="column is-6">
            <div
              v-if="profile.profileVersionGt('0.2.0')"
              class="field is-horizontal mt-6"
            >
              <div class="field-label">
                <label class="label" for="throttle_mid">
                  Throttle Mid
                  <tooltip entry="rate.throttle_mid" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      class="input"
                      step="0.01"
                      id="throttle_mid"
                      type="number"
                      min="0"
                      max="1"
                      v-model.number="profile.rate.throttle_mid"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="profile.profileVersionGt('0.2.0')"
              class="field is-horizontal"
            >
              <div class="field-label">
                <label class="label" for="throttle_expo">
                  Throttle Expo
                  <tooltip entry="rate.throttle_expo" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      class="input"
                      step="0.01"
                      id="throttle_expo"
                      type="number"
                      min="0"
                      max="1"
                      v-model.number="profile.rate.throttle_expo"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal mt-6">
              <div class="field-label">
                <label class="label" for="torque-boost">
                  Torque Boost
                  <tooltip entry="motor.torque_boost" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      id="torque-boost"
                      v-model.number="profile.motor.torque_boost"
                      class="input"
                      type="number"
                      step="0.1"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label" for="throttle-boost">
                  Throttle Boost
                  <tooltip entry="motor.throttle_boost" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      id="throttle-boost"
                      v-model.number="profile.motor.throttle_boost"
                      class="input"
                      type="number"
                      step="0.1"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="profile.profileVersionGt('0.2.0')" class="column is-6">
            <LineChart
              :title="'Throttle'"
              :labels="plot.labels"
              :axis="plot.axis"
              class="image is-fullwidth is-4by3"
            ></LineChart>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { useInfoStore } from "@/store/info";
import { useProfileStore } from "@/store/profile";
import { defineComponent } from "vue";

import LineChart from "@/components/LineChart.vue";

export default defineComponent({
  name: "ThrottleSettings",
  components: {
    LineChart,
  },
  setup() {
    return {
      info: useInfoStore(),
      profile: useProfileStore(),
    };
  },
  data() {
    return {
      plot: {
        labels: ["Throttle"],
        axis: [
          {
            label: "Throttle",
            data: [] as any[],
          },
        ],
      },
    };
  },
  watch: {
    "profile.rate.throttle_expo"() {
      this.update();
    },
    "profile.rate.throttle_mid"() {
      this.update();
    },
  },
  computed: {
    throttleScaleBreakpointPct: {
      get(): number {
        return Math.round(
          (this.profile.rover.throttle_scale_breakpoint || 0) * 100,
        );
      },
      set(val: number) {
        this.profile.rover.throttle_scale_breakpoint = Math.min(
          1,
          Math.max(0, (val || 0) / 100),
        );
      },
    },
    throttleScaleFactorPct: {
      get(): number {
        return Math.round(
          (this.profile.rover.throttle_scale_factor || 0) * 100,
        );
      },
      set(val: number) {
        this.profile.rover.throttle_scale_factor = Math.min(
          1,
          Math.max(0, (val || 0) / 100),
        );
      },
    },
  },
  methods: {
    constrainf(val, lower, upper) {
      if (val > upper) return upper;
      if (val < lower) return lower;
      return val;
    },
    calcThrottle(throttle: number): number {
      const expo = this.profile.rate.throttle_expo;
      const mid = this.profile.rate.throttle_mid;

      if (this.profile.profileVersionGt("0.2.5")) {
        const throttle_minus_mid = throttle - mid;

        let divisor = 1;
        if (throttle_minus_mid > 0.0) {
          divisor = 1 - mid;
        }
        if (throttle_minus_mid < 0.0) {
          divisor = mid;
        }

        return this.constrainf(
          mid +
            throttle_minus_mid *
              (1 -
                expo +
                (expo * (throttle_minus_mid * throttle_minus_mid)) /
                  (divisor * divisor)),
          0.0,
          1.0,
        );
      }

      const n = throttle * 2.0 - 1.0;
      return this.constrainf(
        (n * n * n * expo + n * (1.0 - expo) + 1.0) * mid,
        0.0,
        1.0,
      );
    },
    update() {
      if (this.info.is_rover || !this.profile.profileVersionGt("0.2.0")) {
        return;
      }
      const axis = [] as any[];
      for (let i = 0; i <= 100; i++) {
        const input = i / 100.0;
        axis.push({
          x: i,
          y: this.calcThrottle(input) * 100,
        });
      }
      this.plot.axis[0].data = axis;
    },
  },
  created() {
    this.update();
  },
});
</script>
