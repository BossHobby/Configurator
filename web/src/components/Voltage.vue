<template>
  <b-card>
    <h5 slot="header" class="mb-0">
      Voltage
      <small class="float-right">{{vbat.filter.toPrecision(3)}}V</small>
    </h5>
    <b-row>
      <b-col sm="5" class="my-2">
        <label for="lipo-cell-count">LipoCellCount</label>
      </b-col>
      <b-col sm="7" class="my-2">
        <b-form-input
          id="lipo-cell-count"
          type="number"
          step="1"
          v-model.number="profile.Voltage.LipoCellCount"
        ></b-form-input>
      </b-col>

      <b-col sm="5" class="my-2">
        <label for="pid-voltage-compensation">PidVoltageCompensation</label>
      </b-col>
      <b-col sm="7" class="my-2">
        <div class="custom-control custom-checkbox">
          <input
            type="checkbox"
            class="custom-control-input"
            id="pid-voltage-compensation"
            v-model="profile.Voltage.PidVoltageCompensation"
            true-value="1"
            false-value="0"
          />
          <label class="custom-control-label" for="pid-voltage-compensation">Enable</label>
        </div>
      </b-col>

      <b-col sm="5" class="my-2">
        <label for="stop-lowbattery">StopLowbattery</label>
      </b-col>
      <b-col sm="7" class="my-2">
        <div class="custom-control custom-checkbox">
          <input
            type="checkbox"
            class="custom-control-input"
            id="stop-lowbattery"
            v-model="profile.Voltage.StopLowbattery"
            true-value="1"
            false-value="0"
          />
          <label class="custom-control-label" for="stop-lowbattery">Enable</label>
        </div>
      </b-col>

      <b-col sm="5" class="my-2">
        <label for="actual-battery-voltage">ActualBatteryVoltage</label>
      </b-col>
      <b-col sm="7" class="my-2">
        <b-form-input
          id="actual-battery-voltage"
          type="number"
          step="1"
          v-model.number="profile.Voltage.ActualBatteryVoltage"
        ></b-form-input>
      </b-col>

      <b-col sm="5" class="my-2">
        <label for="reported-telemetry-voltage">ReportedTelemetryVoltage</label>
      </b-col>
      <b-col sm="7" class="my-2">
        <b-form-input
          id="reported-telemetry-voltage"
          type="number"
          step="1"
          v-model.number="profile.Voltage.ReportedTelemetryVoltage"
        ></b-form-input>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import { get } from "@/api.js";
import { mapActions, mapState } from "vuex";

export default {
  name: "voltage",
  computed: mapState(["profile"]),
  data() {
    return {
      vbat: {
        filter: 0.0,
        compare: 0.0
      }
    };
  },
  methods: {
    ...mapActions([])
  },
  created() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    get("/api/vbat").then(res => (this.vbat = res));
    this.interval = setInterval(() => {
      get("/api/vbat").then(res => (this.vbat = res));
    }, 2500);
  },
  destroyed() {
    clearInterval(this.interval);
  }
};
</script>
