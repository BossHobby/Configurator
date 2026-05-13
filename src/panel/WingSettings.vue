<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Wing Settings</p>
    </header>

    <div class="card-content">
      <div class="content column-narrow field-is-5">
        <h4>Autotrim</h4>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">I-Term Threshold</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  v-model.number="profile.wing.autotrim_threshold"
                  class="input"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">Trim Step (%)</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  v-model.number="autotrimStepPct"
                  class="input"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                />
              </div>
            </div>
          </div>
        </div>

        <h4>Autolaunch</h4>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">Accel Threshold (g)</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  v-model.number="profile.wing.autolaunch_accel_threshold"
                  class="input"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">GPS Speed Threshold (m/s)</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  v-model.number="profile.wing.autolaunch_velocity_threshold"
                  class="input"
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">Max Launch Altitude (m)</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  v-model.number="profile.wing.autolaunch_max_altitude"
                  class="input"
                  type="number"
                  step="1"
                  min="0"
                  max="200"
                />
                <p class="help">0 disables altitude-based launch exit.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">Idle Throttle (%)</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  v-model.number="autolaunchIdleThrottlePct"
                  class="input"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">Launch Throttle (%)</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  v-model.number="autolaunchThrottlePct"
                  class="input"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">Launch Pitch (deg)</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  v-model.number="profile.wing.autolaunch_pitch_angle"
                  class="input"
                  type="number"
                  step="1"
                  min="-20"
                  max="45"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">Stick Deadband (%)</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  v-model.number="autolaunchStickDeadbandPct"
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

        <div class="columns is-variable is-4">
          <div class="column">
            <label class="label">Detect Time (ms)</label>
            <input
              v-model.number="profile.wing.autolaunch_detect_time_ms"
              class="input"
              type="number"
              step="10"
              min="0"
            />
          </div>
          <div class="column">
            <label class="label">Idle Delay (ms)</label>
            <input
              v-model.number="profile.wing.autolaunch_idle_delay_ms"
              class="input"
              type="number"
              step="50"
              min="0"
            />
          </div>
        </div>

        <div class="columns is-variable is-4">
          <div class="column">
            <label class="label">Motor Delay (ms)</label>
            <input
              v-model.number="profile.wing.autolaunch_motor_delay_ms"
              class="input"
              type="number"
              step="50"
              min="0"
            />
          </div>
          <div class="column">
            <label class="label">Spinup (ms)</label>
            <input
              v-model.number="profile.wing.autolaunch_spinup_ms"
              class="input"
              type="number"
              step="50"
              min="0"
            />
          </div>
        </div>

        <div class="columns is-variable is-4">
          <div class="column">
            <label class="label">Min Launch Time (ms)</label>
            <input
              v-model.number="profile.wing.autolaunch_min_time_ms"
              class="input"
              type="number"
              step="100"
              min="0"
            />
          </div>
          <div class="column">
            <label class="label">Timeout (ms)</label>
            <input
              v-model.number="profile.wing.autolaunch_timeout_ms"
              class="input"
              type="number"
              step="100"
              min="0"
            />
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">Finish Ramp (ms)</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  v-model.number="profile.wing.autolaunch_finish_ms"
                  class="input"
                  type="number"
                  step="50"
                  min="0"
                />
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
  name: "WingSettings",
  setup() {
    return {
      profile: useProfileStore(),
    };
  },
  computed: {
    autotrimStepPct: {
      get(): number {
        return Math.round((this.profile.wing.autotrim_step || 0) * 1000) / 10;
      },
      set(val: number) {
        this.profile.wing.autotrim_step = Math.max(0, (val || 0) / 100);
      },
    },
    autolaunchIdleThrottlePct: {
      get(): number {
        return Math.round(
          (this.profile.wing.autolaunch_idle_throttle || 0) * 100,
        );
      },
      set(val: number) {
        this.profile.wing.autolaunch_idle_throttle = this.clampPercent(val);
      },
    },
    autolaunchThrottlePct: {
      get(): number {
        return Math.round((this.profile.wing.autolaunch_throttle || 0) * 100);
      },
      set(val: number) {
        this.profile.wing.autolaunch_throttle = this.clampPercent(val);
      },
    },
    autolaunchStickDeadbandPct: {
      get(): number {
        return Math.round(
          (this.profile.wing.autolaunch_stick_deadband || 0) * 100,
        );
      },
      set(val: number) {
        this.profile.wing.autolaunch_stick_deadband = this.clampPercent(val);
      },
    },
  },
  methods: {
    clampPercent(val: number): number {
      return Math.min(1, Math.max(0, (val || 0) / 100));
    },
  },
});
</script>
