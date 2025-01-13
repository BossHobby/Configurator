<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Throttle Settings</p>
    </header>

    <div class="card-content">
      <div class="content">
        <div class="columns column-narrow field-is-5">
          <div class="column is-6">
            <div class="field is-horizontal mt-6">
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

            <div class="field is-horizontal">
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
          </div>
          <div class="column is-6">
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
        // curve from https://github.com/BossHobby/QUICKSILVER/pull/122
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
      } else {
        // original quicksilver implementation of throttle curve
        const n = throttle * 2.0 - 1.0;

        return this.constrainf(
          (n * n * n * expo + n * (1.0 - expo) + 1.0) * mid,
          0.0,
          1.0,
        );
      }
    },
    update() {
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
