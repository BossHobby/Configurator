<template>
  <Panel title="PID">
    <div v-if="info.is_rover" class="form-grid">
      <div class="form-row">
        <label class="form-label" for="rover-pid-kp">Steering PID Kp</label>
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
      <div class="form-row">
        <label class="form-label" for="rover-pid-ki">Steering PID Ki</label>
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
      <div class="form-row">
        <label class="form-label" for="rover-pid-kd">Steering PID Kd</label>
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

    <div v-else class="grid gap-8 py-2 xl:grid-cols-2">
      <div class="min-w-0 space-y-8">
        <div class="form-grid">
          <div class="form-row">
            <label class="form-label" for="pid-preset">
              PID Preset <tooltip entry="pid.preset" />
            </label>
            <div class="flex min-w-0 items-center gap-2">
              <UiSelect
                id="pid-preset"
                v-model.number="current_preset"
                class="flex-1"
                :options="presets"
              />
              <spinner-btn
                :disabled="current_preset == -1"
                @click="load_preset(current_preset)"
                >Load</spinner-btn
              >
            </div>
          </div>
        </div>

        <table class="data-table [&_td]:py-3 [&_th]:py-3">
          <thead>
            <tr>
              <th scope="col"><span class="sr-only">Term</span></th>
              <th v-for="axis in axes" :key="axis" scope="col">{{ axis }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="key in pidTermKeys" :key="key">
              <th scope="row" class="w-16">
                <span class="inline-flex items-center gap-1.5"
                  >{{ pidTermLabels[key] || key }}
                  <tooltip
                    v-if="key === 'kff'"
                    text="Wing rate feedforward. 100 gives full output at 1 rad/s requested rotation. Applies to stick and leveling rate targets."
                /></span>
              </th>
              <td v-for="(axis, i) in axes" :key="axis">
                <input
                  v-model.number="pid_rates[key][i]"
                  :aria-label="`${pidTermLabels[key] || key} ${axis}`"
                  class="form-input"
                  type="number"
                  step="1.0"
                  min="0"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div class="form-grid">
          <div class="form-row">
            <label class="form-label" for="throttle_dterm_attenuation-enable">
              Throttle D-Term Attenuation <tooltip entry="pid.tda_active" />
            </label>
            <UiSelect
              id="throttle_dterm_attenuation-enable"
              v-model.number="profile.pid.throttle_dterm_attenuation.tda_active"
              :options="tdaOptions"
            />
          </div>
          <div class="form-row">
            <label
              class="form-label"
              for="throttle_dterm_attenuation-breakpoint"
            >
              TDA Breakpoint <tooltip entry="pid.tda_breakpoint" />
            </label>
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
          <div class="form-row">
            <label class="form-label" for="throttle_dterm_attenuation-percent">
              TDA Percent <tooltip entry="pid.tda_percent" />
            </label>
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

      <div class="min-w-0 space-y-8">
        <div class="form-grid">
          <div class="form-row">
            <label class="form-label" for="stick-profile">
              Stick Boost Profile <tooltip entry="pid.stick_profile" />
            </label>
            <UiSelect
              id="stick-profile"
              v-model.number="profile.pid.stick_profile"
              :options="stickProfiles"
            />
          </div>
        </div>

        <table class="data-table [&_td]:py-3 [&_th]:py-3">
          <thead>
            <tr>
              <th scope="col"><span class="sr-only">Setting</span></th>
              <th v-for="axis in axes" :key="axis" scope="col">{{ axis }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(val, key) in stick_rates" :key="key">
              <th scope="row" class="w-28 capitalize">{{ key }}</th>
              <td v-for="(axis, i) in axes" :key="axis">
                <input
                  v-model.number="stick_rates[key][i]"
                  :aria-label="`${key} ${axis}`"
                  class="form-input"
                  type="number"
                  step="0.01"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <table class="data-table [&_td]:py-3 [&_th]:py-3">
          <thead>
            <tr>
              <th scope="col">
                <span class="inline-flex items-center gap-1.5"
                  >Angle Strength <tooltip entry="pid.angle_strength"
                /></span>
              </th>
              <th scope="col">Small</th>
              <th scope="col">Big</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="key in ['kp', 'kd']" :key="key">
              <th scope="row" class="w-28">{{ pidTermLabels[key] }}</th>
              <td>
                <input
                  v-model.number="profile.pid.small_angle[key]"
                  :aria-label="`Small angle ${pidTermLabels[key]}`"
                  class="form-input"
                  type="number"
                  step="0.01"
                />
              </td>
              <td>
                <input
                  v-model.number="profile.pid.big_angle[key]"
                  :aria-label="`Big angle ${pidTermLabels[key]}`"
                  class="form-input"
                  type="number"
                  step="0.01"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </Panel>
</template>

<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
import { defineComponent } from "vue";
import { useInfoStore } from "@/store/info";
import { useProfileStore } from "@/store/profile";
import { useRootStore } from "@/store/root";

export default defineComponent({
  name: "PIDRates",
  components: { Panel },
  setup() {
    return {
      info: useInfoStore(),
      root: useRootStore(),
      profile: useProfileStore(),
    };
  },
  data() {
    return {
      axes: ["Roll", "Pitch", "Yaw"],
      pidTermLabels: { kp: "P", ki: "I", kd: "D", kff: "FF" } as Record<
        string,
        string
      >,
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
