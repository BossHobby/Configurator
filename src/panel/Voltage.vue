<template>
  <Panel
    title="Voltage & Current"
    :description="`${state.vbat.toFixed(2)} V · ${state.ibat_filtered.toFixed(2)} mA`"
  >
    <div class="grid gap-4 sm:grid-cols-2">
      <FieldSelect
        v-model="profile.voltage.pid_voltage_compensation"
        label="PID voltage compensation"
        :options="
          pidVoltageCompensationOptions.map((o) => ({
            value: o.value,
            label: o.text,
          }))
        "
      />
      <label
        v-for="field in fields"
        :key="field.key"
        class="text-xs text-muted"
      >
        {{ field.label }} <tooltip :entry="'voltage.' + field.key" />
        <input
          v-model.number="profile.voltage[field.key]"
          type="number"
          min="0"
          :step="field.step"
          class="mt-1.5 min-h-9 w-full rounded-md border border-line bg-subtle px-3 py-2 text-sm text-ink tabular-nums"
        />
      </label>
      <Toggle
        v-if="profile.profileVersionGt('0.2.2')"
        :model-value="!!profile.voltage.use_filtered_voltage_for_warnings"
        label="Filtered voltage warnings"
        @update:model-value="
          profile.voltage.use_filtered_voltage_for_warnings = $event ? 1 : 0
        "
      />
    </div>
  </Panel>
</template>
<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
import FieldSelect from "@/components/ui/Select.vue";
import Toggle from "@/components/ui/Toggle.vue";
import { defineComponent } from "vue";
import { useProfileStore } from "@/store/profile";
import { useStateStore } from "@/store/state";

export default defineComponent({
  name: "Voltage",
  components: { Panel, FieldSelect, Toggle },
  setup() {
    return {
      profile: useProfileStore(),
      state: useStateStore(),
    };
  },
  data() {
    return {
      fields: [
        { key: "lipo_cell_count", label: "LiPo cell count", step: 1 },
        { key: "vbattlow", label: "Voltage warning threshold (V)", step: 0.1 },
        {
          key: "actual_battery_voltage",
          label: "Actual battery voltage (V)",
          step: 0.1,
        },
        {
          key: "reported_telemetry_voltage",
          label: "Reported battery voltage (V)",
          step: 0.1,
        },
        { key: "vbat_scale", label: "Voltage meter scale", step: 1 },
        { key: "ibat_scale", label: "Current meter scale", step: 1 },
      ],
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
