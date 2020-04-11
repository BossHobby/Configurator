<template>
  <b-card>
    <h5 slot="header" class="mb-0">Rates</h5>
    <b-row>
      <b-col sm="6">
        <b-row>
          <b-col sm="4">
            <label for="rate-mode">Mode</label>
          </b-col>
          <b-col sm="8">
            <b-form-select id="rate-mode" v-model.number="rate.mode" :options="rateModes"></b-form-select>
          </b-col>

          <b-col sm="12" v-for="mode in rateModes" :key="mode.text">
            <b-card class="my-3" v-if="mode.value == rate.mode">
              <h6 slot="header" class="mb-0">{{mode.text}}</h6>
              <b-row>
                <b-col offset="4" sm="8">
                  <b-row>
                    <b-col sm="4">
                      <h6>Roll</h6>
                    </b-col>
                    <b-col sm="4">
                      <h6>Pitch</h6>
                    </b-col>
                    <b-col sm="4">
                      <h6>Yaw</h6>
                    </b-col>
                  </b-row>
                </b-col>
              </b-row>

              <b-row v-for="(val, key) in rate[mode.text.toLowerCase()]" :key="key">
                <b-col sm="4">
                  <label :for="`${mode.text}-${key}`">{{ key }}</label>
                </b-col>
                <b-col sm="8">
                  <b-row>
                    <b-col sm="4">
                      <b-form-input
                        :id="`${mode.text}-${key}-roll`"
                        type="number"
                        step="0.05"
                        v-model.number="rate[mode.text.toLowerCase()][key][0]"
                      ></b-form-input>
                    </b-col>
                    <b-col sm="4">
                      <b-form-input
                        :id="`${mode.text}-${key}-pitch`"
                        type="number"
                        step="0.05"
                        v-model.number="rate[mode.text.toLowerCase()][key][1]"
                      ></b-form-input>
                    </b-col>
                    <b-col sm="4">
                      <b-form-input
                        :id="`${mode.text}-${key}-yaw`"
                        type="number"
                        step="0.05"
                        v-model.number="rate[mode.text.toLowerCase()][key][2]"
                      ></b-form-input>
                    </b-col>
                  </b-row>
                </b-col>
              </b-row>
            </b-card>
          </b-col>

          <b-col sm="4" class="my-2">
            <label for="level-max-angle">LevelMaxAngle</label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-input
              id="level-max-angle"
              type="number"
              step="5"
              v-model.number="rate.level_max_angle"
            ></b-form-input>
          </b-col>

          <b-col sm="4" class="my-2">
            <label for="low-rate-mulitplier">LowRateMulitplier</label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-input
              id="low-rate-mulitplier"
              type="number"
              v-model.number="rate.low_rate_mulitplier"
              step="0.05"
            ></b-form-input>
          </b-col>

          <b-col sm="4" class="my-2">
            <label for="sticks-deadband">SticksDeadband</label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-input
              step="0.01"
              id="sticks-deadband"
              type="number"
              v-model.number="rate.sticks_deadband"
            ></b-form-input>
          </b-col>
        </b-row>
      </b-col>
      <b-col sm="6">
        <LineChart
          v-if="rate.silverware.acro_expo"
          title="Rates"
          :labels="plot.labels"
          :axis="plot.axis"
        ></LineChart>
        <b-form-checkbox v-model="plotLowRates">Plot LowRates</b-form-checkbox>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import LineChart from "@/components/LineChart";
import { mapState } from "vuex";

export default {
  name: "StickRates",
  components: {
    LineChart
  },
  computed: {
    ...mapState({
      rate: state => state.profile.rate
    }),
    currentMode() {
      return this.rateModes[this.rate.mode].text;
    },
    plot() {
      const axis = [
        {
          label: "Roll",
          data: []
        },
        {
          label: "Pitch",
          data: []
        },
        {
          label: "Yaw",
          data: []
        }
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
              y: this.calcSilverware(j, input) * rateMulit
            });
          } else if (this.currentMode == "Betaflight") {
            axis[j].data.push({
              x: i,
              y: this.calcBetatflight(j, input) * rateMulit
            });
          }
        }
      }

      return {
        labels,
        axis
      };
    }
  },
  data() {
    return {
      plotLowRates: false,
      rateModes: [
        { value: 0, text: "Silverware" },
        { value: 1, text: "Betaflight" }
      ]
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
      return this.constrainf(
        angleRate,
        -SETPOINT_RATE_LIMIT,
        SETPOINT_RATE_LIMIT
      );
    }
  }
};
</script>

<style scoped>
</style>
