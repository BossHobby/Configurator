<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Motor Pins</p>
      <tooltip class="card-header-icon" entry="motor_pins" size="lg" />
    </header>

    <div class="card-content">
      <div class="content">
        <div class="columns is-multiline my-2">
          <div class="column is-6" v-for="m in motor.pins" :key="'motor-pin-' + m.index">
            <div class="field field-is-2 is-horizontal">
              <div class="field-label">
                <label class="label" for="pid-profile">
                  {{ m.label }}
                  <br />
                  <span class="text-muted">Motor {{ m.index }}</span>
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      :id="'motor-pin-' + m.index"
                      class="is-fullwidth"
                      v-model="profile.motor.motor_pins[m.index]"
                      :options="motorPins"
                    ></input-select>
                  </div>
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
import { useInfoStore } from "@/store/info";
import { useMotorStore } from "@/store/motor";

export default defineComponent({
  name: "MotorPins",
  setup() {
    return {
      profile: useProfileStore(),
      info: useInfoStore(),
      motor: useMotorStore(),
    };
  },
  computed: {
    motorPins() {
      return this.info.motor_pins.map((v, i) => {
        return {
          value: i,
          text: `Pin ${i} (${v})`,
        };
      });
    },
  },
});
</script>
