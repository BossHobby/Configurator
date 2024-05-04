<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Motor Pins</p>
      <tooltip class="card-header-icon" entry="motor_pins" size="lg" />
    </header>

    <div class="card-content">
      <div class="content">
        <div class="columns is-multiline my-2">
          <div
            v-for="m in motor.pins"
            :key="'motor-pin-' + m.index"
            class="column is-6"
          >
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
                      v-model="profile.motor.motor_pins[m.index]"
                      class="is-fullwidth"
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
import { useMotorStore } from "@/store/motor";
import { useTargetStore } from "@/store/target";

export default defineComponent({
  name: "MotorPins",
  setup() {
    return {
      motor: useMotorStore(),
      target: useTargetStore(),
      profile: useProfileStore(),
    };
  },
  computed: {
    motorPins() {
      return this.target.motor_pin_names.map((v, i) => {
        return {
          value: i,
          text: `Pin ${i} (${v})`,
        };
      });
    },
  },
});
</script>
