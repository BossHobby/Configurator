<template>
  <b-card>
    <h5 slot="header" class="mb-0">
      Voltage
      <small class="float-right">{{blackbox.vbat_filter.toPrecision(3)}}V</small>
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
          v-model.number="profile.voltage.lipo_cell_count"
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
            v-model="pid_voltage_compensation"
          />
          <label class="custom-control-label" for="pid-voltage-compensation">Enable</label>
        </div>
      </b-col>

      <b-col sm="5" class="my-2">
        <label for="vbattlow">VBattLow</label>
      </b-col>
      <b-col sm="7" class="my-2">
        <b-form-input
          id="vbattlow"
          type="number"
          step="0.1"
          v-model.number="profile.voltage.vbattlow"
        ></b-form-input>
      </b-col>

      <b-col sm="5" class="my-2">
        <label for="actual-battery-voltage">ActualBatteryVoltage</label>
      </b-col>
      <b-col sm="7" class="my-2">
        <b-form-input
          id="actual-battery-voltage"
          type="number"
          step="1"
          v-model.number="profile.voltage.actual_battery_voltage"
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
          v-model.number="profile.voltage.reported_telemetry_voltage"
        ></b-form-input>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "voltage",
  computed: {
    ...mapState(["profile", "blackbox"]),
    pid_voltage_compensation: {
      get() {
        return this.profile.voltage.pid_voltage_compensation;
      },
      set(val) {
        this.profile.voltage.pid_voltage_compensation = val ? 1 : 0;
      }
    }
  }
};
</script>
