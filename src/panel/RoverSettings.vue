<template>
  <Panel title="Rover Settings"
    ><div class="space-y-4">
      <div class="form-grid">
        <div class="form-row">
          <label for="center-deadband" class="form-label"
            >Center Deadband (%)</label
          >
          <input
            id="center-deadband"
            v-model.number="centerDeadbandPct"
            class="form-input"
            type="number"
            step="1"
            min="0"
            max="50"
          />
        </div>

        <div class="form-row">
          <label for="yaw-rate" class="form-label">Max Yaw Rate (deg/s)</label>
          <input
            id="yaw-rate"
            v-model.number="profile.rover.yaw_rate"
            class="form-input"
            type="number"
            step="10"
            min="0"
            max="720"
          />
        </div>

        <div class="form-row">
          <label for="rover-settings-reversible-motor" class="form-label">
            Reversible Motor
            <tooltip entry="rover.reversible"
          /></label>
          <div class="min-w-0">
            <UiSelect
              id="rover-settings-reversible-motor"
              v-model.number="profile.rover.reversible"
              class="w-full"
              :options="reversibleOptions"
            ></UiSelect>
          </div>
        </div>
      </div></div
  ></Panel>
</template>

<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
import { defineComponent } from "vue";
import { useProfileStore } from "@/store/profile";

export default defineComponent({
  name: "RoverSettings",
  components: { Panel },
  setup() {
    return {
      profile: useProfileStore(),
    };
  },
  data() {
    return {
      reversibleOptions: [
        { value: 0, text: "Off" },
        { value: 1, text: "On" },
      ],
    };
  },
  computed: {
    centerDeadbandPct: {
      get(): number {
        return Math.round((this.profile.rover.center_deadband || 0) * 100);
      },
      set(val: number) {
        this.profile.rover.center_deadband = Math.min(
          0.5,
          Math.max(0, (val || 0) / 100),
        );
      },
    },
  },
});
</script>
