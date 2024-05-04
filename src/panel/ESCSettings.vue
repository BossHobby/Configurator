<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">ESC Settings</p>
      <tooltip class="card-header-icon" entry="motor_settings" size="lg" />
    </header>

    <div class="card-content">
      <div class="content">
        <div
          v-if="motor.settings && motor.settings.length"
          class="columns is-multiline"
        >
          <div
            v-for="m in motor.pins"
            :key="'motor-settings-' + m.index"
            class="column is-6 px-5"
          >
            <div class="columns is-multiline my-2">
              <div class="column is-4">
                <h6>{{ m.label }}</h6>
              </div>
              <div class="column is-8">
                {{ trim(motor.settings[mapPin(m)].LAYOUT) }}
                -
                {{ trim(motor.settings[mapPin(m)].NAME) }},
                {{ motor.settings[mapPin(m)].MAIN_REVISION }}.{{
                  motor.settings[mapPin(m)].SUB_REVISION
                }}
              </div>

              <div class="column is-4 pt-0 mt-0">
                <label :for="'motor-direction-' + m.index">Direction</label>
              </div>
              <div class="column is-8 pt-0 mt-0">
                <input-select
                  :id="'motor-direction-' + m.index"
                  v-model.number="motor.settings[mapPin(m)].MOTOR_DIRECTION"
                  :options="motor_direction_options"
                ></input-select>
              </div>
            </div>
          </div>
        </div>
        <div
          v-else
          class="is-size-5 has-text-centered has-text-weight-semibold"
        >
          Settings not loaded
        </div>
      </div>
    </div>

    <footer class="card-footer">
      <span class="card-footer-item"></span>
      <span class="card-footer-item"></span>
      <spinner-btn
        v-if="motor.settings && motor.settings.length"
        class="card-footer-item"
        :disabled="motor.loading"
        @click="motor.apply_motor_settings(motor.settings)"
      >
        Apply
      </spinner-btn>
      <spinner-btn
        v-else
        class="card-footer-item"
        :disabled="motor.loading"
        @click="motor.fetch_motor_settings()"
      >
        Load
      </spinner-btn>
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useMotorStore } from "@/store/motor";
import { useInfoStore } from "@/store/info";
import semver from "semver";

export default defineComponent({
  name: "ESCSettings",
  setup() {
    return {
      motor: useMotorStore(),
      info: useInfoStore(),
    };
  },
  data() {
    return {
      motor_direction_options: [
        { value: 1, text: "Normal" },
        { value: 2, text: "Reversed" },
        { value: 3, text: "Bidirectional" },
        { value: 4, text: "Bidirectional Reversed" },
      ],
    };
  },
  methods: {
    trim(str) {
      return str.replace(/#/g, "").replace(/\$/g, " ");
    },
    mapPin(m) {
      if (semver.gt(this.info.quic_protocol_semver, "0.2.1")) {
        return m.index;
      }
      return m.pin;
    },
  },
});
</script>
