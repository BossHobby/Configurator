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
                      v-model="profile_motor.motor_pins[m.index]"
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
import { mapState } from "vuex";
import { mapFields } from "@/store/helper.js";

export default defineComponent({
  name: "MotorPins",
  computed: {
    ...mapFields("profile", { profile_motor: "motor" }),
    ...mapState({
      motor_pins: (state) => state.info.motor_pins,
    }),
    ...mapState(["motor"]),
    motorPins() {
      return this.motor_pins.map((v, i) => {
        return {
          value: i,
          text: `Pin ${i} (${v})`,
        };
      });
    },
  },
});
</script>
