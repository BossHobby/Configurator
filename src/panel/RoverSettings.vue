<template>
  <div class="min-w-0 rounded-lg border border-line bg-panel text-ink">
    <header
      class="flex items-center justify-between gap-3 px-4 py-3 border-b border-line"
    >
      <p class="text-sm font-semibold">Rover Settings</p>
    </header>

    <div class="p-4">
      <div class="space-y-4">
        <div class="form-row">
          <div class="form-label">
            <label class="text-sm font-medium text-ink"
              >Center Deadband (%)</label
            >
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">
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
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-label">
            <label class="text-sm font-medium text-ink"
              >Max Yaw Rate (deg/s)</label
            >
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">
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
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-label">
            <label class="text-sm font-medium text-ink">
              Reversible Motor
              <tooltip entry="rover.reversible" />
            </label>
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0">
                <input-select
                  v-model.number="profile.rover.reversible"
                  class="w-full"
                  :options="reversibleOptions"
                ></input-select>
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

export default defineComponent({
  name: "RoverSettings",
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
