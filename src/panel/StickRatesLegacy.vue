<template>
  <Panel title="Rates"
    ><div class="space-y-4">
      <div class="grid grid-cols-12 gap-4">
        <div class="min-w-0 col-span-12 md:col-span-6">
          <div class="form-row">
            <label class="form-label" for="rate-mode">
              Mode
              <tooltip entry="rate.mode"
            /></label>
            <UiSelect
              id="rate-mode"
              v-model.number="profile.rate.mode"
              class="w-full"
              :options="rateModes"
              @change="update()"
            ></UiSelect>
          </div>

          <table class="data-table my-4">
            <thead>
              <tr>
                <th scope="col">{{ currentMode.text }}</th>
                <th v-for="axis in axes" :key="axis" scope="col">
                  {{ axis }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(val, key) in profile.rate[
                  currentMode.text.toLowerCase()
                ]"
                :key="key"
              >
                <th scope="row" class="w-36 capitalize">
                  {{ String(key).replace(/_/g, " ") }}
                </th>
                <td v-for="(axis, i) in axes" :key="axis">
                  <input
                    v-model.number="
                      profile.rate[currentMode.text.toLowerCase()][key][i]
                    "
                    :aria-label="`${key} ${axis}`"
                    class="form-input"
                    type="number"
                    step="10"
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <div class="form-grid">
            <div class="form-row">
              <label class="form-label" for="level-max-angle">
                LevelMaxAngle
                <tooltip entry="rate.level_max_angle"
              /></label>
              <input
                id="level-max-angle"
                v-model.number="profile.rate.level_max_angle"
                class="form-input"
                type="number"
                step="5"
              />
            </div>

            <div class="form-row">
              <label class="form-label" for="low-rate-mulitplier">
                LowRateMulitplier
                <tooltip entry="rate.low_rate_mulitplier"
              /></label>
              <input
                id="low-rate-mulitplier"
                v-model.number="profile.rate.low_rate_mulitplier"
                class="form-input"
                type="number"
                step="0.05"
              />
            </div>

            <div class="form-row">
              <label class="form-label" for="sticks-deadband">
                SticksDeadband
                <tooltip entry="rate.sticks_deadband"
              /></label>
              <input
                id="sticks-deadband"
                v-model.number="profile.rate.sticks_deadband"
                class="form-input"
                step="0.01"
                type="number"
              />
            </div>
          </div>
        </div>
        <div class="min-w-0 col-span-12 md:col-span-6">
          <div class="relative h-72 min-w-0 xl:h-80">
            <LineChart
              v-if="profile.rate.silverware.acro_expo"
              :title="(plotLowRates ? 'Low ' : '') + 'Rates'"
              :labels="plot.labels"
              :axis="plot.axis"
            />
          </div>
          <label class="mt-3 inline-flex items-center gap-2 text-sm">
            <input v-model="plotLowRates" type="checkbox" class="form-switch" />
            Plot low rates
          </label>
        </div>
      </div>
    </div></Panel
  >
</template>

<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
import { defineComponent } from "vue";
import LineChart from "@/components/LineChart.vue";
import { useProfileStore } from "@/store/profile";

export default defineComponent({
  name: "StickRatesLegacy",
  components: { Panel, LineChart },
  setup() {
    return {
      profile: useProfileStore(),
    };
  },
  data() {
    return {
      axes: ["Roll", "Pitch", "Yaw"],
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
  mounted() {
    this.update();
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
        SETPOINT_RATE_LIMIT,
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
});
</script>

<style scoped></style>
