<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">PID</p>
    </header>

    <div class="card-content">
      <div class="content column-narrow field-is-5">
        <div class="columns">
          <div class="column is-6">
            <div class="field field-is-2 is-horizontal">
              <div class="field-label">
                <label class="label" for="pid-preset">
                  PID Preset
                  <tooltip entry="pid.preset" />
                </label>
              </div>
              <div class="field-body">
                <div class="field has-addons">
                  <div class="control is-expanded">
                    <input-select
                      id="pid-preset"
                      class="is-fullwidth"
                      v-model.number="current_preset"
                      :options="presets"
                    ></input-select>
                  </div>
                  <div class="control">
                    <spinner-btn @click="load_preset(current_preset)"> Load </spinner-btn>
                  </div>
                </div>
              </div>
            </div>

            <div class="field field-is-2 is-horizontal">
              <div class="field-label">
                <label class="label" for="pid-profile">
                  PIDProfile
                  <tooltip entry="pid.profile" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      id="pid-profile"
                      class="is-fullwidth"
                      v-model.number="profile.pid.pid_profile"
                      :options="pidProfiles"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>

            <div class="columns mt-4 mb-0">
              <div class="column is-offset-4 is-8">
                <div class="columns">
                  <div class="column is-4">
                    <h6>Roll</h6>
                  </div>
                  <div class="column is-4">
                    <h6>Pitch</h6>
                  </div>
                  <div class="column is-4">
                    <h6>Yaw</h6>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="field field-is-2 is-horizontal"
              v-for="(val, key) in pid_rates"
              :key="key"
            >
              <div class="field-label">
                <label class="label">{{ key }}</label>
              </div>
              <div class="field-body">
                <div class="field">
                  <p class="control is-expanded">
                    <input
                      class="input"
                      :id="`pid-${key}-roll`"
                      type="number"
                      step="1.0"
                      v-model.number="pid_rates[key][0]"
                    />
                  </p>
                </div>
                <div class="field">
                  <p class="control is-expanded">
                    <input
                      class="input"
                      :id="`pid-${key}-pitch`"
                      type="number"
                      step="1.0"
                      v-model.number="pid_rates[key][1]"
                    />
                  </p>
                </div>
                <div class="field">
                  <p class="control is-expanded">
                    <input
                      class="input"
                      :id="`pid-${key}-yaw`"
                      type="number"
                      step="1.0"
                      v-model.number="pid_rates[key][2]"
                    />
                  </p>
                </div>
              </div>
            </div>

            <div class="field is-horizontal mt-6">
              <div class="field-label">
                <label class="label" for="throttle_dterm_attenuation-enable">
                  Throttle DTerm Attenuation
                  <tooltip entry="pid.tda_active" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      id="throttle_dterm_attenuation-enable"
                      class="is-fullwidth"
                      v-model.number="profile.pid.throttle_dterm_attenuation.tda_active"
                      :options="tdaOptions"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label" for="throttle_dterm_attenuation-breakpoint">
                  TDA Breakpoint
                  <tooltip entry="pid.tda_breakpoint" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      class="input"
                      id="throttle_dterm_attenuation-breakpoint"
                      type="number"
                      step="0.05"
                      v-model.number="
                        profile.pid.throttle_dterm_attenuation.tda_breakpoint
                      "
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label" for="throttle_dterm_attenuation-percent">
                  TDA Percent
                  <tooltip entry="pid.tda_percent" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      class="input"
                      id="throttle_dterm_attenuation-percent"
                      type="number"
                      step="0.05"
                      v-model.number="profile.pid.throttle_dterm_attenuation.tda_percent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="column is-6">
            <div class="field field-is-2 is-horizontal">
              <div class="field-label">
                <label class="label" for="stick-profile">
                  Stick Boost Profile
                  <tooltip entry="pid.stick_profile" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      id="stick-profile"
                      class="is-fullwidth"
                      v-model.number="profile.pid.stick_profile"
                      :options="stickProfiles"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>

            <div class="columns my-0">
              <div class="column is-offset-4 is-8">
                <div class="columns">
                  <div class="column is-4">
                    <h6>Roll</h6>
                  </div>
                  <div class="column is-4">
                    <h6>Pitch</h6>
                  </div>
                  <div class="column is-4">
                    <h6>Yaw</h6>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="field field-is-2 is-horizontal"
              v-for="(val, key) in stick_rates"
              :key="key"
            >
              <div class="field-label">
                <label class="label">{{ key }}</label>
              </div>
              <div class="field-body">
                <div class="field">
                  <p class="control is-expanded">
                    <input
                      class="input"
                      :id="`stick-${key}-roll`"
                      type="number"
                      step="0.01"
                      v-model.number="stick_rates[key][0]"
                    />
                  </p>
                </div>
                <div class="field">
                  <p class="control is-expanded">
                    <input
                      class="input"
                      :id="`stick-${key}-pitch`"
                      type="number"
                      step="0.01"
                      v-model.number="stick_rates[key][1]"
                    />
                  </p>
                </div>
                <div class="field">
                  <p class="control is-expanded">
                    <input
                      class="input"
                      :id="`stick-${key}-yaw`"
                      type="number"
                      step="0.01"
                      v-model.number="stick_rates[key][2]"
                    />
                  </p>
                </div>
              </div>
            </div>

            <div class="columns mt-6 mb-1">
              <div class="column is-4">
                <h6 class="has-text-right">
                  Angle Strength
                  <tooltip entry="pid.angle_strength" />
                </h6>
              </div>
              <div class="column is-4">
                <h6>Small</h6>
              </div>
              <div class="column is-4">
                <h6>Big</h6>
              </div>
            </div>

            <div
              class="field field-is-2 is-horizontal"
              v-for="(key, index) in ['kp', 'kd']"
              :key="index"
            >
              <div class="field-label">
                <label class="label">{{ key }}</label>
              </div>
              <div class="field-body">
                <div class="field">
                  <p class="control is-expanded">
                    <input
                      class="input"
                      :id="`small-angle-${key}`"
                      type="number"
                      step="0.01"
                      v-model.number="profile.pid.small_angle[key]"
                    />
                  </p>
                </div>
                <div class="field">
                  <p class="control is-expanded">
                    <input
                      class="input"
                      :id="`big-angle-${key}`"
                      type="number"
                      step="0.01"
                      v-model.number="profile.pid.big_angle[key]"
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
import { useProfileStore } from "@/store/profile";
import { useRootStore } from "@/store/root";

export default defineComponent({
  name: "PIDRates",
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
        { value: 0, text: "None" },
        { value: 1, text: "Active" },
        { value: 2, text: "Max" },
      ],
      current_preset: 0,
    };
  },
  setup() {
    return {
      root: useRootStore(),
      profile: useProfileStore(),
    };
  },
  computed: {
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
      return this.root.pid_rate_presets.map((p) => {
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
