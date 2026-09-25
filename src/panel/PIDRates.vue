<template>
  <div class="min-w-0 rounded-lg border border-line bg-panel text-ink">
    <header
      class="flex items-center justify-between gap-3 px-4 py-3 border-b border-line"
    >
      <p class="text-sm font-semibold">PID</p>
    </header>

    <div class="p-4">
      <div v-if="info.is_rover" class="space-y-4">
        <div class="form-row">
          <div class="form-label">
            <label class="text-sm font-medium text-ink" for="rover-pid-kp"
              >Steering PID Kp</label
            >
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">
                <input
                  id="rover-pid-kp"
                  v-model.number="profile.rover.pid.kp"
                  class="form-input"
                  type="number"
                  step="0.1"
                  min="0"
                  max="200"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-label">
            <label class="text-sm font-medium text-ink" for="rover-pid-ki"
              >Steering PID Ki</label
            >
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">
                <input
                  id="rover-pid-ki"
                  v-model.number="profile.rover.pid.ki"
                  class="form-input"
                  type="number"
                  step="0.1"
                  min="0"
                  max="200"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-label">
            <label class="text-sm font-medium text-ink" for="rover-pid-kd"
              >Steering PID Kd</label
            >
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">
                <input
                  id="rover-pid-kd"
                  v-model.number="profile.rover.pid.kd"
                  class="form-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max="200"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="space-y-4">
        <div class="grid grid-cols-12 gap-4">
          <div class="min-w-0 col-span-12 md:col-span-6">
            <div class="form-row">
              <div class="form-label">
                <label class="text-sm font-medium text-ink" for="pid-preset">
                  PID Preset
                  <tooltip entry="pid.preset" />
                </label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1 flex items-center gap-2">
                  <div class="min-w-0 flex-1">
                    <input-select
                      id="pid-preset"
                      v-model.number="current_preset"
                      class="w-full"
                      :options="presets"
                    ></input-select>
                  </div>
                  <div class="min-w-0">
                    <spinner-btn
                      :disabled="current_preset == -1"
                      @click="load_preset(current_preset)"
                    >
                      Load
                    </spinner-btn>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label">
                <label class="text-sm font-medium text-ink" for="pid-profile">
                  PIDProfile
                  <tooltip entry="pid.profile" />
                </label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0 flex-1">
                    <input-select
                      id="pid-profile"
                      v-model.number="profile.pid.pid_profile"
                      class="w-full"
                      :options="pidProfiles"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-12 gap-4 mt-4 mb-0">
              <div class="min-w-0 md:col-start-5 col-span-12 md:col-span-8">
                <div class="grid grid-cols-12 gap-4">
                  <div class="min-w-0 col-span-12 md:col-span-4">
                    <h6>Roll</h6>
                  </div>
                  <div class="min-w-0 col-span-12 md:col-span-4">
                    <h6>Pitch</h6>
                  </div>
                  <div class="min-w-0 col-span-12 md:col-span-4">
                    <h6>Yaw</h6>
                  </div>
                </div>
              </div>
            </div>

            <div v-for="key in pidTermKeys" :key="key" class="form-row">
              <div class="form-label">
                <label class="text-sm font-medium text-ink">
                  {{ key === "kff" ? "FF" : key }}
                  <tooltip
                    v-if="key === 'kff'"
                    text="Wing rate feedforward. 100 gives full output at 1 rad/s requested rotation. Applies to stick and leveling rate targets."
                  />
                </label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <p class="min-w-0 flex-1">
                    <input
                      :id="`pid-${key}-roll`"
                      v-model.number="pid_rates[key][0]"
                      class="form-input"
                      type="number"
                      step="1.0"
                      min="0"
                    />
                  </p>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="min-w-0 flex-1">
                    <input
                      :id="`pid-${key}-pitch`"
                      v-model.number="pid_rates[key][1]"
                      class="form-input"
                      type="number"
                      step="1.0"
                      min="0"
                    />
                  </p>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="min-w-0 flex-1">
                    <input
                      :id="`pid-${key}-yaw`"
                      v-model.number="pid_rates[key][2]"
                      class="form-input"
                      type="number"
                      step="1.0"
                      min="0"
                    />
                  </p>
                </div>
              </div>
            </div>

            <div class="form-row mt-6">
              <div class="form-label">
                <label
                  class="text-sm font-medium text-ink"
                  for="throttle_dterm_attenuation-enable"
                >
                  Throttle DTerm Attenuation
                  <tooltip entry="pid.tda_active" />
                </label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0 flex-1">
                    <input-select
                      id="throttle_dterm_attenuation-enable"
                      v-model.number="
                        profile.pid.throttle_dterm_attenuation.tda_active
                      "
                      class="w-full"
                      :options="tdaOptions"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label">
                <label
                  class="text-sm font-medium text-ink"
                  for="throttle_dterm_attenuation-breakpoint"
                >
                  TDA Breakpoint
                  <tooltip entry="pid.tda_breakpoint" />
                </label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0 flex-1">
                    <input
                      id="throttle_dterm_attenuation-breakpoint"
                      v-model.number="
                        profile.pid.throttle_dterm_attenuation.tda_breakpoint
                      "
                      class="form-input"
                      type="number"
                      step="0.05"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label">
                <label
                  class="text-sm font-medium text-ink"
                  for="throttle_dterm_attenuation-percent"
                >
                  TDA Percent
                  <tooltip entry="pid.tda_percent" />
                </label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0 flex-1">
                    <input
                      id="throttle_dterm_attenuation-percent"
                      v-model.number="
                        profile.pid.throttle_dterm_attenuation.tda_percent
                      "
                      class="form-input"
                      type="number"
                      step="0.05"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="min-w-0 col-span-12 md:col-span-6">
            <div class="form-row">
              <div class="form-label">
                <label class="text-sm font-medium text-ink" for="stick-profile">
                  Stick Boost Profile
                  <tooltip entry="pid.stick_profile" />
                </label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0 flex-1">
                    <input-select
                      id="stick-profile"
                      v-model.number="profile.pid.stick_profile"
                      class="w-full"
                      :options="stickProfiles"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-12 gap-4 my-0">
              <div class="min-w-0 md:col-start-5 col-span-12 md:col-span-8">
                <div class="grid grid-cols-12 gap-4">
                  <div class="min-w-0 col-span-12 md:col-span-4">
                    <h6>Roll</h6>
                  </div>
                  <div class="min-w-0 col-span-12 md:col-span-4">
                    <h6>Pitch</h6>
                  </div>
                  <div class="min-w-0 col-span-12 md:col-span-4">
                    <h6>Yaw</h6>
                  </div>
                </div>
              </div>
            </div>

            <div v-for="(val, key) in stick_rates" :key="key" class="form-row">
              <div class="form-label">
                <label class="text-sm font-medium text-ink">{{ key }}</label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <p class="min-w-0 flex-1">
                    <input
                      :id="`stick-${key}-roll`"
                      v-model.number="stick_rates[key][0]"
                      class="form-input"
                      type="number"
                      step="0.01"
                    />
                  </p>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="min-w-0 flex-1">
                    <input
                      :id="`stick-${key}-pitch`"
                      v-model.number="stick_rates[key][1]"
                      class="form-input"
                      type="number"
                      step="0.01"
                    />
                  </p>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="min-w-0 flex-1">
                    <input
                      :id="`stick-${key}-yaw`"
                      v-model.number="stick_rates[key][2]"
                      class="form-input"
                      type="number"
                      step="0.01"
                    />
                  </p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-12 gap-4 mt-6 mb-1">
              <div class="min-w-0 col-span-12 md:col-span-4">
                <h6 class="text-right">
                  Angle Strength
                  <tooltip entry="pid.angle_strength" />
                </h6>
              </div>
              <div class="min-w-0 col-span-12 md:col-span-4">
                <h6>Small</h6>
              </div>
              <div class="min-w-0 col-span-12 md:col-span-4">
                <h6>Big</h6>
              </div>
            </div>

            <div
              v-for="(key, index) in ['kp', 'kd']"
              :key="index"
              class="form-row"
            >
              <div class="form-label">
                <label class="text-sm font-medium text-ink">{{ key }}</label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <p class="min-w-0 flex-1">
                    <input
                      :id="`small-angle-${key}`"
                      v-model.number="profile.pid.small_angle[key]"
                      class="form-input"
                      type="number"
                      step="0.01"
                    />
                  </p>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="min-w-0 flex-1">
                    <input
                      :id="`big-angle-${key}`"
                      v-model.number="profile.pid.big_angle[key]"
                      class="form-input"
                      type="number"
                      step="0.01"
                    />
                  </p>
                </div>
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
import { useInfoStore } from "@/store/info";
import { useProfileStore } from "@/store/profile";
import { useRootStore } from "@/store/root";

export default defineComponent({
  name: "PIDRates",
  setup() {
    return {
      info: useInfoStore(),
      root: useRootStore(),
      profile: useProfileStore(),
    };
  },
  data() {
    return {
      pidProfiles: [
        { value: 0, text: "PID Profile 1" },
        { value: 1, text: "PID Profile 2" },
      ],
      stickProfiles: [
        { value: 0, text: "Stick Boost Profile AUX Off" },
        { value: 1, text: "Stick Boost Profile AUX On" },
      ],
      tdaOptions: [
        { value: 0, text: "Off" },
        { value: 1, text: "On" },
      ],
      current_preset: -1,
    };
  },
  computed: {
    pidTermKeys() {
      return Object.keys(this.pid_rates).filter(
        (key) => key !== "kff" || this.info.is_wing,
      );
    },
    pid_rates: {
      get() {
        return this.profile.current_pid_rate;
      },
      set(value) {
        this.profile.set_current_pid_rate(value);
      },
    },
    stick_rates: {
      get() {
        return this.profile.current_stick_rate;
      },
      set(value) {
        this.profile.set_current_stick_rate(value);
      },
    },
    presets() {
      return [
        { index: -1, name: "Choose..." },
        ...this.root.pid_rate_presets,
      ].map((p) => {
        return {
          value: p.index,
          text: p.name,
        };
      });
    },
  },
  methods: {
    load_preset(index) {
      this.pid_rates = this.root.pid_rate_presets[index].rate;
    },
  },
});
</script>

<style scoped></style>
