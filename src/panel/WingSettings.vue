<template>
  <Panel title="Wing Settings" description="Autolaunch, level and loiter">
    <div class="space-y-6">
      <fieldset class="min-w-0 border-t border-line pt-4">
        <legend class="pr-3 text-sm font-semibold">Launch detection</legend>
        <div class="form-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          <div class="form-row">
            <label for="wing-settings-accel-threshold-g" class="form-label"
              >Accel Threshold (g)
              <tooltip entry="wing.autolaunch.accel_threshold"
            /></label>
            <input
              id="wing-settings-accel-threshold-g"
              v-model.number="profile.wing.autolaunch.accel_threshold"
              class="form-input"
              type="number"
              step="0.1"
              min="0"
              max="5"
            />
          </div>
          <div class="form-row">
            <label
              for="wing-settings-gps-speed-threshold-m-s"
              class="form-label"
              >GPS Speed Threshold (m/s)
              <tooltip entry="wing.autolaunch.velocity_threshold"
            /></label>
            <input
              id="wing-settings-gps-speed-threshold-m-s"
              v-model.number="profile.wing.autolaunch.velocity_threshold"
              class="form-input"
              type="number"
              step="0.5"
              min="0"
              max="50"
            />
          </div>
          <div class="form-row">
            <label for="wing-autolaunch-detect-time-ms" class="form-label"
              >Detect Time (ms) <tooltip entry="wing.autolaunch.detect_time_ms"
            /></label>
            <input
              id="wing-autolaunch-detect-time-ms"
              v-model.number="profile.wing.autolaunch.detect_time_ms"
              class="form-input"
              type="number"
              step="10"
              min="0"
            />
          </div>
        </div>
      </fieldset>
      <fieldset class="min-w-0 border-t border-line pt-4">
        <legend class="pr-3 text-sm font-semibold">Motor startup</legend>
        <div class="form-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          <div class="form-row">
            <label for="wing-settings-idle-throttle" class="form-label"
              >Idle Throttle (%) <tooltip entry="wing.autolaunch.idle_throttle"
            /></label>
            <input
              id="wing-settings-idle-throttle"
              v-model.number="autolaunchIdleThrottlePct"
              class="form-input"
              type="number"
              step="1"
              min="0"
              max="100"
            />
          </div>
          <div class="form-row">
            <label for="wing-autolaunch-idle-delay-ms" class="form-label"
              >Idle Delay (ms) <tooltip entry="wing.autolaunch.idle_delay_ms"
            /></label>
            <input
              id="wing-autolaunch-idle-delay-ms"
              v-model.number="profile.wing.autolaunch.idle_delay_ms"
              class="form-input"
              type="number"
              step="50"
              min="0"
            />
          </div>
          <div class="form-row">
            <label for="wing-autolaunch-motor-delay-ms" class="form-label"
              >Motor Delay (ms) <tooltip entry="wing.autolaunch.motor_delay_ms"
            /></label>
            <input
              id="wing-autolaunch-motor-delay-ms"
              v-model.number="profile.wing.autolaunch.motor_delay_ms"
              class="form-input"
              type="number"
              step="50"
              min="0"
            />
          </div>
          <div class="form-row">
            <label for="wing-autolaunch-spinup-ms" class="form-label"
              >Spinup (ms) <tooltip entry="wing.autolaunch.spinup_ms"
            /></label>
            <input
              id="wing-autolaunch-spinup-ms"
              v-model.number="profile.wing.autolaunch.spinup_ms"
              class="form-input"
              type="number"
              step="50"
              min="0"
            />
          </div>
        </div>
      </fieldset>
      <fieldset class="min-w-0 border-t border-line pt-4">
        <legend class="pr-3 text-sm font-semibold">Launch climb</legend>
        <div class="form-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          <div class="form-row">
            <label for="wing-settings-launch-throttle" class="form-label"
              >Launch Throttle (%) <tooltip entry="wing.autolaunch.throttle"
            /></label>
            <input
              id="wing-settings-launch-throttle"
              v-model.number="autolaunchThrottlePct"
              class="form-input"
              type="number"
              step="1"
              min="0"
              max="100"
            />
          </div>
          <div class="form-row">
            <label for="wing-settings-launch-pitch-deg" class="form-label"
              >Launch Pitch (deg) <tooltip entry="wing.autolaunch.pitch_angle"
            /></label>
            <input
              id="wing-settings-launch-pitch-deg"
              v-model.number="profile.wing.autolaunch.pitch_angle"
              class="form-input"
              type="number"
              step="1"
              min="-20"
              max="45"
            />
          </div>
        </div>
      </fieldset>
      <fieldset class="min-w-0 border-t border-line pt-4">
        <legend class="pr-3 text-sm font-semibold">Launch completion</legend>
        <div class="form-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          <div class="form-row">
            <label for="wing-autolaunch-min-time-ms" class="form-label"
              >Min Launch Time (ms)
              <tooltip entry="wing.autolaunch.min_time_ms"
            /></label>
            <input
              id="wing-autolaunch-min-time-ms"
              v-model.number="profile.wing.autolaunch.min_time_ms"
              class="form-input"
              type="number"
              step="100"
              min="0"
            />
          </div>
          <div class="form-row">
            <label for="wing-autolaunch-timeout-ms" class="form-label"
              >Timeout (ms) <tooltip entry="wing.autolaunch.timeout_ms"
            /></label>
            <input
              id="wing-autolaunch-timeout-ms"
              v-model.number="profile.wing.autolaunch.timeout_ms"
              class="form-input"
              type="number"
              step="100"
              min="0"
            />
          </div>
          <div class="form-row">
            <label for="wing-settings-max-launch-altitude-m" class="form-label"
              >Max Launch Altitude (m)
              <tooltip entry="wing.autolaunch.max_altitude"
            /></label>
            <div class="min-w-0 flex-1">
              <input
                id="wing-settings-max-launch-altitude-m"
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
          <div class="form-row">
            <label for="wing-settings-stick-deadband" class="form-label"
              >Stick Deadband (%)
              <tooltip entry="wing.autolaunch.stick_deadband"
            /></label>
            <input
              id="wing-settings-stick-deadband"
              v-model.number="autolaunchStickDeadbandPct"
              class="form-input"
              type="number"
              step="1"
              min="0"
              max="50"
            />
          </div>
          <div class="form-row">
            <label for="wing-settings-finish-ramp-ms" class="form-label"
              >Finish Ramp (ms) <tooltip entry="wing.autolaunch.finish_ms"
            /></label>
            <input
              id="wing-settings-finish-ramp-ms"
              v-model.number="profile.wing.autolaunch.finish_ms"
              class="form-input"
              type="number"
              step="50"
              min="0"
            />
          </div>
        </div>
      </fieldset>
      <fieldset
        v-if="profile.wing.banked_turns !== undefined"
        class="min-w-0 border-t border-line pt-4"
      >
        <legend class="pr-3 text-sm font-semibold">Level</legend>
        <label class="inline-flex items-center gap-3 text-sm">
          <input v-model="bankedTurns" type="checkbox" class="form-switch" />
          Banked turns
          <tooltip entry="wing.banked_turns" />
        </label>
      </fieldset>
      <fieldset
        v-if="profile.navigation.loiter_radius !== undefined"
        class="min-w-0 border-t border-line pt-4"
      >
        <legend class="pr-3 text-sm font-semibold">Navigation</legend>
        <label class="mb-4 inline-flex items-center gap-3 text-sm">
          <input
            v-model="profile.navigation.rth_on_failsafe"
            type="checkbox"
            class="form-switch"
          />
          Return to home on failsafe
          <tooltip entry="navigation.wing_rth_on_failsafe" />
        </label>
        <div class="form-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          <div class="form-row">
            <label for="wing-settings-rth-altitude" class="form-label"
              >RTH Climb Height (m)
              <tooltip entry="navigation.wing_rth_altitude"
            /></label>
            <input
              id="wing-settings-rth-altitude"
              v-model.number="profile.navigation.rth_altitude"
              class="form-input"
              type="number"
              step="5"
              min="0"
            />
          </div>
          <div class="form-row">
            <label for="wing-settings-cruise-throttle" class="form-label"
              >Cruise Throttle (%) <tooltip entry="navigation.cruise_throttle"
            /></label>
            <input
              id="wing-settings-cruise-throttle"
              v-model.number="cruiseThrottlePct"
              class="form-input"
              type="number"
              step="1"
              min="0"
              max="100"
            />
          </div>
          <div class="form-row">
            <label for="wing-settings-max-bank-angle" class="form-label"
              >Max Bank (deg) <tooltip entry="navigation.max_bank_angle"
            /></label>
            <input
              id="wing-settings-max-bank-angle"
              v-model.number="profile.navigation.max_bank_angle"
              class="form-input"
              type="number"
              step="1"
              min="0"
              max="80"
            />
          </div>
          <div class="form-row">
            <label for="wing-settings-loiter-radius" class="form-label"
              >Loiter Radius (m) <tooltip entry="navigation.loiter_radius"
            /></label>
            <input
              id="wing-settings-loiter-radius"
              v-model.number="profile.navigation.loiter_radius"
              class="form-input"
              type="number"
              step="5"
              min="1"
            />
          </div>
          <div class="form-row">
            <label for="wing-settings-loiter-direction" class="form-label"
              >Loiter Direction <tooltip entry="navigation.loiter_direction"
            /></label>
            <div class="relative">
              <select
                id="wing-settings-loiter-direction"
                v-model.number="profile.navigation.loiter_direction"
                class="form-select"
              >
                <option :value="0">Right (clockwise)</option>
                <option :value="1">Left (counter-clockwise)</option>
              </select>
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  </Panel>
</template>

<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
import { defineComponent } from "vue";
import { useProfileStore } from "@/store/profile";

export default defineComponent({
  name: "WingSettings",
  components: { Panel },
  setup() {
    return {
      profile: useProfileStore(),
    };
  },
  computed: {
    bankedTurns: {
      get(): boolean {
        return !!this.profile.wing.banked_turns;
      },
      set(val: boolean) {
        this.profile.wing.banked_turns = val ? 1 : 0;
      },
    },
    cruiseThrottlePct: {
      get(): number {
        return Math.round((this.profile.navigation.cruise_throttle || 0) * 100);
      },
      set(val: number) {
        this.profile.navigation.cruise_throttle = this.clampPercent(val);
      },
    },
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
