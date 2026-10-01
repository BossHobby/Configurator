<template>
  <Panel title="Throttle Settings"
    ><div v-if="info.is_rover" class="space-y-4">
      <div class="form-grid">
        <div class="form-row">
          <label class="form-label" for="rover-throttle-scale-breakpoint"
            >Throttle Scale Breakpoint (%)</label
          >
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

        <div class="form-row">
          <label class="form-label" for="rover-throttle-scale-factor"
            >Throttle Scale Factor (%)</label
          >
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

    <div v-else class="space-y-4">
      <div class="grid grid-cols-12 gap-4">
        <div class="min-w-0 col-span-12 md:col-span-6">
          <div class="form-grid grid-cols-2">
            <div v-if="profile.profileVersionGt('0.2.0')" class="form-row">
              <label class="form-label" for="throttle_mid">
                Throttle Mid
                <tooltip entry="rate.throttle_mid"
              /></label>
              <input
                id="throttle_mid"
                v-model.number="profile.rate.throttle_mid"
                class="form-input"
                step="0.01"
                type="number"
                min="0"
                max="1"
              />
            </div>

            <div v-if="profile.profileVersionGt('0.2.0')" class="form-row">
              <label class="form-label" for="throttle_expo">
                Throttle Expo
                <tooltip entry="rate.throttle_expo"
              /></label>
              <input
                id="throttle_expo"
                v-model.number="profile.rate.throttle_expo"
                class="form-input"
                step="0.01"
                type="number"
                min="0"
                max="1"
              />
            </div>

            <div class="form-row">
              <label class="form-label" for="torque-boost">
                Torque Boost
                <tooltip entry="motor.torque_boost"
              /></label>
              <input
                id="torque-boost"
                v-model.number="profile.motor.torque_boost"
                class="form-input"
                type="number"
                step="0.1"
                min="0"
              />
            </div>

            <div class="form-row">
              <label class="form-label" for="throttle-boost">
                Throttle Boost
                <tooltip entry="motor.throttle_boost"
              /></label>
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
        <div
          v-if="profile.profileVersionGt('0.2.0')"
          class="relative h-64 min-w-0 col-span-12 md:col-span-6"
        >
          <LineChart
            title="Throttle curve"
            :labels="plot.labels"
            :axis="plot.axis"
          />
        </div>
      </div></div
  ></Panel>
</template>

<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
import { useInfoStore } from "@/store/info";
import { useProfileStore } from "@/store/profile";
import { defineComponent } from "vue";

import LineChart from "@/components/LineChart.vue";

export default defineComponent({
  name: "ThrottleSettings",
  components: { Panel, LineChart },
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
  watch: {
    "profile.rate.throttle_expo"() {
      this.update();
    },
    "profile.rate.throttle_mid"() {
      this.update();
    },
  },
  created() {
    this.update();
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
});
</script>
