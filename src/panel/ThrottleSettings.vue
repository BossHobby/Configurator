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
          <div class="column is-6" style="height: 30vw">
            <LineChart
              :title="'Throttle'"
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
      const n = throttle * 2.0 - 1.0;
      const expo = this.profile.rate.throttle_expo;
      const mid = this.profile.rate.throttle_mid;
      return this.constrainf(
        (n * n * n * expo + n * (1.0 - expo) + 1.0) * mid,
        0.0,
        1.0,
      );
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
