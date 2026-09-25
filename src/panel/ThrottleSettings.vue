<template>
  <div class="min-w-0 rounded-lg border border-line bg-panel text-ink">
    <header
      class="flex items-center justify-between gap-3 px-4 py-3 border-b border-line"
    >
      <p class="text-sm font-semibold">Throttle Settings</p>
    </header>

    <div class="p-4">
      <div v-if="info.is_rover" class="space-y-4">
        <div class="form-row">
          <div class="form-label">
            <label
              class="text-sm font-medium text-ink"
              for="rover-throttle-scale-breakpoint"
              >Throttle Scale Breakpoint (%)</label
            >
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">
                <input
                  id="rover-throttle-scale-breakpoint"
                  v-model.number="throttleScaleBreakpointPct"
                  class="form-input"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-label">
            <label
              class="text-sm font-medium text-ink"
              for="rover-throttle-scale-factor"
              >Throttle Scale Factor (%)</label
            >
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">
                <input
                  id="rover-throttle-scale-factor"
                  v-model.number="throttleScaleFactorPct"
                  class="form-input"
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

      <div v-else class="space-y-4">
        <div class="grid grid-cols-12 gap-4">
          <div class="min-w-0 col-span-12 md:col-span-6">
            <div v-if="profile.profileVersionGt('0.2.0')" class="form-row mt-6">
              <div class="form-label">
                <label class="text-sm font-medium text-ink" for="throttle_mid">
                  Throttle Mid
                  <tooltip entry="rate.throttle_mid" />
                </label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0 flex-1">
                    <input
                      class="form-input"
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

            <div v-if="profile.profileVersionGt('0.2.0')" class="form-row">
              <div class="form-label">
                <label class="text-sm font-medium text-ink" for="throttle_expo">
                  Throttle Expo
                  <tooltip entry="rate.throttle_expo" />
                </label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0 flex-1">
                    <input
                      class="form-input"
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

            <div class="form-row mt-6">
              <div class="form-label">
                <label class="text-sm font-medium text-ink" for="torque-boost">
                  Torque Boost
                  <tooltip entry="motor.torque_boost" />
                </label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0 flex-1">
                    <input
                      id="torque-boost"
                      v-model.number="profile.motor.torque_boost"
                      class="form-input"
                      type="number"
                      step="0.1"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label">
                <label
                  class="text-sm font-medium text-ink"
                  for="throttle-boost"
                >
                  Throttle Boost
                  <tooltip entry="motor.throttle_boost" />
                </label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0 flex-1">
                    <input
                      id="throttle-boost"
                      v-model.number="profile.motor.throttle_boost"
                      class="form-input"
                      type="number"
                      step="0.1"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="profile.profileVersionGt('0.2.0')"
            class="min-w-0 col-span-12 md:col-span-6"
          >
            <LineChart
              :title="'Throttle'"
              :labels="plot.labels"
              :axis="plot.axis"
              class="block w-full aspect-[4/3]"
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
