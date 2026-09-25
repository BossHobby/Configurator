<template>
  <div class="min-w-0 rounded-lg border border-line bg-panel text-ink">
    <header
      class="flex items-center justify-between gap-3 px-4 py-3 border-b border-line"
    >
      <p class="text-sm font-semibold">Wing Settings</p>
    </header>

    <div class="p-4">
      <div class="space-y-4">
        <h4>Autolaunch</h4>

        <div class="form-row">
          <div class="form-label">
            <label class="text-sm font-medium text-ink"
              >Accel Threshold (g)</label
            >
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">
                <input
                  v-model.number="profile.wing.autolaunch.accel_threshold"
                  class="form-input"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-label">
            <label class="text-sm font-medium text-ink"
              >GPS Speed Threshold (m/s)</label
            >
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">
                <input
                  v-model.number="profile.wing.autolaunch.velocity_threshold"
                  class="form-input"
                  type="number"
                  step="0.5"
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
              >Max Launch Altitude (m)</label
            >
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">
                <input
                  v-model.number="profile.wing.autolaunch.max_altitude"
                  class="form-input"
                  type="number"
                  step="1"
                  min="0"
                  max="200"
                />
                <p class="mt-1 text-xs text-muted">
                  0 disables altitude-based launch exit.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-label">
            <label class="text-sm font-medium text-ink"
              >Idle Throttle (%)</label
            >
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">
                <input
                  v-model.number="autolaunchIdleThrottlePct"
                  class="form-input"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-label">
            <label class="text-sm font-medium text-ink"
              >Launch Throttle (%)</label
            >
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">
                <input
                  v-model.number="autolaunchThrottlePct"
                  class="form-input"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-label">
            <label class="text-sm font-medium text-ink"
              >Launch Pitch (deg)</label
            >
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">
                <input
                  v-model.number="profile.wing.autolaunch.pitch_angle"
                  class="form-input"
                  type="number"
                  step="1"
                  min="-20"
                  max="45"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-label">
            <label class="text-sm font-medium text-ink"
              >Stick Deadband (%)</label
            >
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">
                <input
                  v-model.number="autolaunchStickDeadbandPct"
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

        <div class="grid grid-cols-12 gap-4">
          <div class="min-w-0 col-span-12 md:col-span-6">
            <label class="text-sm font-medium text-ink">Detect Time (ms)</label>
            <input
              v-model.number="profile.wing.autolaunch.detect_time_ms"
              class="form-input"
              type="number"
              step="10"
              min="0"
            />
          </div>
          <div class="min-w-0 col-span-12 md:col-span-6">
            <label class="text-sm font-medium text-ink">Idle Delay (ms)</label>
            <input
              v-model.number="profile.wing.autolaunch.idle_delay_ms"
              class="form-input"
              type="number"
              step="50"
              min="0"
            />
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <div class="min-w-0 col-span-12 md:col-span-6">
            <label class="text-sm font-medium text-ink">Motor Delay (ms)</label>
            <input
              v-model.number="profile.wing.autolaunch.motor_delay_ms"
              class="form-input"
              type="number"
              step="50"
              min="0"
            />
          </div>
          <div class="min-w-0 col-span-12 md:col-span-6">
            <label class="text-sm font-medium text-ink">Spinup (ms)</label>
            <input
              v-model.number="profile.wing.autolaunch.spinup_ms"
              class="form-input"
              type="number"
              step="50"
              min="0"
            />
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <div class="min-w-0 col-span-12 md:col-span-6">
            <label class="text-sm font-medium text-ink"
              >Min Launch Time (ms)</label
            >
            <input
              v-model.number="profile.wing.autolaunch.min_time_ms"
              class="form-input"
              type="number"
              step="100"
              min="0"
            />
          </div>
          <div class="min-w-0 col-span-12 md:col-span-6">
            <label class="text-sm font-medium text-ink">Timeout (ms)</label>
            <input
              v-model.number="profile.wing.autolaunch.timeout_ms"
              class="form-input"
              type="number"
              step="100"
              min="0"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-label">
            <label class="text-sm font-medium text-ink">Finish Ramp (ms)</label>
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">
                <input
                  v-model.number="profile.wing.autolaunch.finish_ms"
                  class="form-input"
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
    autolaunchIdleThrottlePct: {
      get(): number {
        return Math.round(
          (this.profile.wing.autolaunch.idle_throttle || 0) * 100,
        );
      },
      set(val: number) {
        this.profile.wing.autolaunch.idle_throttle = this.clampPercent(val);
      },
    },
    autolaunchThrottlePct: {
      get(): number {
        return Math.round((this.profile.wing.autolaunch.throttle || 0) * 100);
      },
      set(val: number) {
        this.profile.wing.autolaunch.throttle = this.clampPercent(val);
      },
    },
    autolaunchStickDeadbandPct: {
      get(): number {
        return Math.round(
          (this.profile.wing.autolaunch.stick_deadband || 0) * 100,
        );
      },
      set(val: number) {
        this.profile.wing.autolaunch.stick_deadband = this.clampPercent(val);
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
