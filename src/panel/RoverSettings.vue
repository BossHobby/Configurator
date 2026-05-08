<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Rover Settings</p>
    </header>

    <div class="card-content">
      <div class="content column-narrow field-is-5">
        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">Center Deadband (%)</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  id="center-deadband"
                  v-model.number="centerDeadbandPct"
                  class="input"
                  type="number"
                  step="1"
                  min="0"
                  max="50"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">Max Yaw Rate (deg/s)</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  id="yaw-rate"
                  v-model.number="profile.rover.yaw_rate"
                  class="input"
                  type="number"
                  step="10"
                  min="0"
                  max="720"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">
              Reversible Motor
              <tooltip entry="rover.reversible" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control">
                <input-select
                  v-model.number="profile.rover.reversible"
                  class="is-fullwidth"
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
