<template>
  <div v-if="!info.is_rover" class="card">
    <header class="card-header">
      <p class="card-header-title">Motor Control</p>
    </header>

    <div class="card-content">
      <div class="content column-narrow field-is-5">
        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">
              Torque Boost
              <tooltip entry="motor.torque_boost" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  id="torque-boost"
                  v-model.number="profile.motor.torque_boost"
                  class="input"
                  type="number"
                  step="0.1"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">
              Throttle Boost
              <tooltip entry="motor.throttle_boost" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  id="throttle-boost"
                  v-model.number="profile.motor.throttle_boost"
                  class="input"
                  type="number"
                  step="0.1"
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
import { useInfoStore } from "@/store/info";
import { useProfileStore } from "@/store/profile";

export default defineComponent({
  name: "MotorControlSettings",
  setup() {
    return {
      info: useInfoStore(),
      profile: useProfileStore(),
    };
  },
});
</script>
