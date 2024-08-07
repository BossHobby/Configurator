<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Voltage</p>
      <small class="card-header-icon">
        {{ state.vbat.toFixed(2) }}V {{ state.ibat_filtered.toFixed(2) }}mA
      </small>
    </header>

    <div class="card-content">
      <div class="content column-narrow field-is-5">
        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">
              LipoCellCount
              <tooltip entry="voltage.lipo_cell_count" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  id="lipo-cell-count"
                  v-model.number="profile.voltage.lipo_cell_count"
                  class="input"
                  type="number"
                  step="1"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">
              PidVoltageCompensation
              <tooltip entry="voltage.pid_voltage_compensation" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input-select
                  v-model.number="profile.voltage.pid_voltage_compensation"
                  class="is-fullwidth"
                  :options="pidVoltageCompensationOptions"
                ></input-select>
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">
              VBattLow
              <tooltip entry="voltage.vbattlow" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  id="vbattlow"
                  v-model.number="profile.voltage.vbattlow"
                  class="input"
                  type="number"
                  step="0.1"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">
              ActualBatteryVoltage
              <tooltip entry="voltage.actual_battery_voltage" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  id="actual-battery-voltage"
                  v-model.number="profile.voltage.actual_battery_voltage"
                  class="input"
                  type="number"
                  step="0.1"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">
              ReportedTelemetryVoltage
              <tooltip entry="voltage.reported_telemetry_voltage" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  id="reported-telemetry-voltage"
                  v-model.number="profile.voltage.reported_telemetry_voltage"
                  class="input"
                  type="number"
                  step="0.1"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">
              Voltage Meter Scale
              <tooltip entry="voltage.vbat_scale" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  id="vbat_scale"
                  v-model.number="profile.voltage.vbat_scale"
                  class="input"
                  type="number"
                  step="1"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">
              Current Meter Scale
              <tooltip entry="voltage.ibat_scale" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  id="ibat_scale"
                  v-model.number="profile.voltage.ibat_scale"
                  class="input"
                  type="number"
                  step="1"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal" v-if="profile.profileVersionGt('0.2.2')">
          <div class="field-label">
            <label class="label">
              Filtered voltage warnings
              <tooltip entry="voltage.use_filtered_voltage_for_warnings" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  type="checkbox"
                  class="switch"
                  id="use_filtered_voltage_for_warnings"
                  :checked="profile.voltage.use_filtered_voltage_for_warnings || 0"
                  @change="profile.voltage.use_filtered_voltage_for_warnings = profile.voltage.use_filtered_voltage_for_warnings ? 0 : 1"
                />
                <label
                  class="py-0"
                  style="height: 2em"
                  for="use_filtered_voltage_for_warnings"
                ></label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useProfileStore } from "@/store/profile";
import { useStateStore } from "@/store/state";

export default defineComponent({
  name: "Voltage",
  setup() {
    return {
      profile: useProfileStore(),
      state: useStateStore(),
    };
  },
  data() {
    return {
      pidVoltageCompensationOptions: [
        { value: 0, text: "Off" },
        { value: 1, text: "On" },
      ],
    };
  },
  computed: {
    pid_voltage_compensation: {
      get() {
        return this.profile.voltage.pid_voltage_compensation;
      },
      set(val) {
        this.profile.voltage.pid_voltage_compensation = val ? 1 : 0;
      },
    },
  },
});
</script>
