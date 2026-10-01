<template>
  <Panel
    title="Wing Settings"
    description="Stabilization, autolaunch, level and loiter"
  >
    <div class="space-y-6">
      <template v-if="profile.profileVersionGt('0.2.7')">
        <h4 class="text-sm font-semibold">Sport Stabilization</h4>
        <p>
          Sport combines direct surface control with gyro damping. Assign Sport
          Mode and Low Rates on the Auxiliary Channels page. Level and Acro take
          priority when their switches are also active.
        </p>
        <div class="space-y-2">
          <label class="inline-flex min-h-9 items-center gap-3 text-sm">
            <input
              v-model="profile.wing.sport_hold"
              type="checkbox"
              class="size-4 accent-accent"
              :true-value="1"
              :false-value="0"
            />
            Hold orientation when sticks are released
          </label>
        </div>
        <div class="space-y-2">
          <label class="inline-flex min-h-9 items-center gap-3 text-sm">
            <input
              v-model="profile.wing.auto_center"
              type="checkbox"
              class="size-4 accent-accent"
              :true-value="1"
              :false-value="0"
            />
            Learn transmitter trims automatically
          </label>
          <p class="text-xs text-muted">
            Learns steady inputs within 25% of center after 0.75 seconds. Keep
            sticks released while trimming. Centers are learned again after
            power-up.
          </p>
          <p class="text-xs text-muted">
            Learned centers:
            {{
              state.wing_rx_center
                .map((value) => `${(value * 100).toFixed(1)}%`)
                .join(" / ")
            }}
            (roll / pitch / yaw)
          </p>
        </div>
        <div class="space-y-2">
          <label class="inline-flex min-h-9 items-center gap-3 text-sm">
            <input
              v-model="profile.wing.banked_turns"
              type="checkbox"
              class="size-4 accent-accent"
              :true-value="1"
              :false-value="0"
            />
            Bank-and-yank correction in Level mode
          </label>
        </div>

        <h4 class="text-sm font-semibold">Manual and Sport Surface Response</h4>
        <table class="w-full text-left text-sm [&_th]:p-2 [&_td]:p-2">
          <thead>
            <tr>
              <th>Axis</th>
              <th>Travel (0–1)</th>
              <th>Expo (0–1)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(axis, index) in axes" :key="axis">
              <th>{{ axis }}</th>
              <td>
                <input
                  v-model.number="profile.wing.surface_rate[index]"
                  :aria-label="`${axis} travel`"
                  class="form-input"
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                />
              </td>
              <td>
                <input
                  v-model.number="profile.wing.surface_expo[index]"
                  :aria-label="`${axis} expo`"
                  class="form-input"
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                />
              </td>
            </tr>
          </tbody>
        </table>
        <div class="space-y-2">
          <label class="form-label" for="wing-low-rate"
            >Low Rate Multiplier (0–1)</label
          >
          <input
            id="wing-low-rate"
            v-model.number="profile.wing.low_rate"
            class="form-input"
            type="number"
            min="0"
            max="1"
            step="0.05"
          />
          <p class="text-xs text-muted">
            Reduces the outer stick curve while preserving trim near center.
            Reduction is limited at low expo. Servo endpoint limits still apply.
          </p>
        </div>

        <h4 class="text-sm font-semibold">Gain Knobs</h4>
        <p>
          Channel endpoints select 50–150% of the configured gain; center
          selects 100%. These adjustments are not saved into the base gains.
        </p>
        <table class="w-full text-left text-sm [&_th]:p-2 [&_td]:p-2">
          <thead>
            <tr>
              <th>Axis</th>
              <th>P</th>
              <th>I</th>
              <th>D</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(axis, index) in axes" :key="axis">
              <th>{{ axis }}</th>
              <td v-for="term in gainTerms" :key="term">
                <div class="min-w-0">
                  <select
                    class="form-select"
                    v-model.number="profile.wing[term][index]"
                    :aria-label="`${axis} ${term.slice(-1).toUpperCase()} gain channel`"
                  >
                    <option :value="16">Fixed</option>
                    <option
                      v-for="channel in 16"
                      :key="channel"
                      :value="channel - 1"
                    >
                      CH {{ channel }}
                    </option>
                  </select>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </template>

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
        v-if="profile.wing.turn_coordination !== undefined"
        class="min-w-0 border-t border-line pt-4"
      >
        <legend class="pr-3 text-sm font-semibold">Level</legend>
        <label class="inline-flex items-center gap-3 text-sm">
          <input
            v-model="turnCoordination"
            type="checkbox"
            class="form-switch"
          />
          Turn coordination
          <tooltip entry="wing.turn_coordination" />
        </label>
      </fieldset>
      <fieldset
        v-if="profile.navigation.loiter_radius !== undefined"
        class="min-w-0 border-t border-line pt-4"
      >
        <legend class="pr-3 text-sm font-semibold">Navigation</legend>
        <div class="mb-4 flex flex-wrap gap-x-6 gap-y-3">
          <label class="inline-flex items-center gap-3 text-sm">
            <input
              v-model="profile.navigation.rth_on_failsafe"
              type="checkbox"
              class="form-switch"
            />
            Return to home on failsafe
            <tooltip entry="navigation.wing_rth_on_failsafe" />
          </label>
          <label
            v-if="profile.navigation.mission_on_failsafe !== undefined"
            class="inline-flex items-center gap-3 text-sm"
          >
            <input
              v-model="profile.navigation.mission_on_failsafe"
              type="checkbox"
              class="form-switch"
            />
            Continue mission on failsafe
            <tooltip entry="navigation.mission_on_failsafe" />
          </label>
        </div>
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
          <div
            v-if="profile.navigation.cruise_speed !== undefined"
            class="form-row"
          >
            <label for="wing-settings-cruise-speed" class="form-label"
              >Cruise Speed (km/h) <tooltip entry="navigation.cruise_speed"
            /></label>
            <input
              id="wing-settings-cruise-speed"
              v-model.number="cruiseSpeedKph"
              class="form-input"
              type="number"
              step="1"
              min="18"
              max="180"
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
              max="40"
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
import { useStateStore } from "@/store/state";

export default defineComponent({
  name: "WingSettings",
  components: { Panel },
  setup() {
    return {
      profile: useProfileStore(),
      state: useStateStore(),
      axes: ["Roll", "Pitch", "Yaw"],
      gainTerms: ["gain_p", "gain_i", "gain_d"] as const,
    };
  },
  computed: {
    turnCoordination: {
      get(): boolean {
        return !!this.profile.wing.turn_coordination;
      },
      set(val: boolean) {
        this.profile.wing.turn_coordination = val ? 1 : 0;
      },
    },
    cruiseSpeedKph: {
      get(): number {
        return Math.round((this.profile.navigation.cruise_speed || 0) * 3.6);
      },
      set(val: number) {
        this.profile.navigation.cruise_speed = val / 3.6;
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
