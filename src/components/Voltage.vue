<template>
  <b-card>
    <h5 slot="header" class="mb-0">
      Voltage
      <small class="float-right">
        {{ state.vbattfilt.toPrecision(3) }}V <br />
        {{ state.ibat_filtered }}mAh
      </small>
    </h5>
    <b-row>
      <b-col sm="5" class="my-2">
        <label for="lipo-cell-count">
          LipoCellCount
          <tooltip entry="voltage.lipo_cell_count" />
        </label>
      </b-col>
      <b-col sm="7" class="my-2">
        <b-form-input
          id="lipo-cell-count"
          type="number"
          step="1"
          v-model.number="voltage.lipo_cell_count"
        ></b-form-input>
      </b-col>

      <b-col sm="5" class="my-2">
        <label for="pid-voltage-compensation">
          PidVoltageCompensation
          <tooltip entry="voltage.pid_voltage_compensation" />
        </label>
      </b-col>
      <b-col sm="7" class="my-2">
        <b-form-select
          v-model.number="voltage.pid_voltage_compensation"
          :options="pidVoltageCompensationOptions"
        ></b-form-select>
      </b-col>

      <b-col sm="5" class="my-2">
        <label for="vbattlow">
          VBattLow
          <tooltip entry="voltage.vbattlow" />
        </label>
      </b-col>
      <b-col sm="7" class="my-2">
        <b-form-input
          id="vbattlow"
          type="number"
          step="0.1"
          v-model.number="voltage.vbattlow"
        ></b-form-input>
      </b-col>

      <b-col sm="5" class="my-2">
        <label for="actual-battery-voltage">
          ActualBatteryVoltage
          <tooltip entry="voltage.actual_battery_voltage" />
        </label>
      </b-col>
      <b-col sm="7" class="my-2">
        <b-form-input
          id="actual-battery-voltage"
          type="number"
          step="0.1"
          v-model.number="voltage.actual_battery_voltage"
        ></b-form-input>
      </b-col>

      <b-col sm="5" class="my-2">
        <label for="reported-telemetry-voltage">
          ReportedTelemetryVoltage
          <tooltip entry="voltage.reported_telemetry_voltage" />
        </label>
      </b-col>
      <b-col sm="7" class="my-2">
        <b-form-input
          id="reported-telemetry-voltage"
          type="number"
          step="0.1"
          v-model.number="voltage.reported_telemetry_voltage"
        ></b-form-input>
      </b-col>

      <b-col sm="5" class="my-2">
        <label for="ibat_scale">
          Current Meter Scale
          <tooltip entry="voltage.ibat_scale" />
        </label>
      </b-col>
      <b-col sm="7" class="my-2">
        <b-form-input
          id="ibat_scale"
          type="number"
          step="1"
          v-model.number="voltage.ibat_scale"
        ></b-form-input>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import { mapState } from "vuex";
import { mapFields } from "@/store/helper.js";

export default {
  name: "voltage",
  data() {
    return {
      pidVoltageCompensationOptions: [
        { value: 0, text: "Off" },
        { value: 1, text: "On" },
      ],
    };
  },
  computed: {
    ...mapFields("profile", ["voltage"]),
    ...mapState(["state"]),
    pid_voltage_compensation: {
      get() {
        return this.voltage.pid_voltage_compensation;
      },
      set(val) {
        this.voltage.pid_voltage_compensation = val ? 1 : 0;
      },
    },
  },
};
</script>
