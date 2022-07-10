<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Voltage</p>
      <small class="card-header-icon">
        {{ vbat.toPrecision(3) }}V {{ state.ibat_filtered }}mAh
      </small>
    </header>

    <div class="card-content">
      <div class="content">
        <div class="columns is-multiline">
          <div class="column is-6">
            <label for="lipo-cell-count">
              LipoCellCount
              <tooltip entry="voltage.lipo_cell_count" />
            </label>
          </div>
          <div class="column is-6">
            <input
              class="input"
              id="lipo-cell-count"
              type="number"
              step="1"
              v-model.number="voltage.lipo_cell_count"
            />
          </div>

          <div class="column is-6">
            <label for="pid-voltage-compensation">
              PidVoltageCompensation
              <tooltip entry="voltage.pid_voltage_compensation" />
            </label>
          </div>
          <div class="column is-6">
            <input-select
              v-model.number="voltage.pid_voltage_compensation"
              :options="pidVoltageCompensationOptions"
            ></input-select>
          </div>

          <div class="column is-6">
            <label for="vbattlow">
              VBattLow
              <tooltip entry="voltage.vbattlow" />
            </label>
          </div>
          <div class="column is-6">
            <input
              class="input"
              id="vbattlow"
              type="number"
              step="0.1"
              v-model.number="voltage.vbattlow"
            />
          </div>

          <div class="column is-6">
            <label for="actual-battery-voltage">
              ActualBatteryVoltage
              <tooltip entry="voltage.actual_battery_voltage" />
            </label>
          </div>
          <div class="column is-6">
            <input
              class="input"
              id="actual-battery-voltage"
              type="number"
              step="0.1"
              v-model.number="voltage.actual_battery_voltage"
            />
          </div>

          <div class="column is-6">
            <label for="reported-telemetry-voltage">
              ReportedTelemetryVoltage
              <tooltip entry="voltage.reported_telemetry_voltage" />
            </label>
          </div>
          <div class="column is-6">
            <input
              class="input"
              id="reported-telemetry-voltage"
              type="number"
              step="0.1"
              v-model.number="voltage.reported_telemetry_voltage"
            />
          </div>

          <div class="column is-6">
            <label for="ibat_scale">
              Current Meter Scale
              <tooltip entry="voltage.ibat_scale" />
            </label>
          </div>
          <div class="column is-6">
            <input
              class="input"
              id="ibat_scale"
              type="number"
              step="1"
              v-model.number="voltage.ibat_scale"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapGetters, mapState } from "vuex";
import { mapFields } from "@/store/helper.js";

export default defineComponent({
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
    ...mapGetters(["vbat"]),
    pid_voltage_compensation: {
      get() {
        return this.voltage.pid_voltage_compensation;
      },
      set(val) {
        this.voltage.pid_voltage_compensation = val ? 1 : 0;
      },
    },
  },
});
</script>
