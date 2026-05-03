<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Board Orientation</p>
    </header>

    <div class="card-content">
      <div class="content column-narrow field-is-5">
        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">
              Flip Gyro
              <tooltip entry="motor.flip_gyro" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  id="gyro-flip"
                  v-model="gyroFlip"
                  type="checkbox"
                  class="switch"
                />
                <label class="py-0" style="height: 2em" for="gyro-flip"></label>
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">
              Gyro Orientation
              <tooltip entry="motor.gyro_orientation" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input-select
                  id="gyro-orientation"
                  v-model="gyroOrientation"
                  class="is-fullwidth"
                  :options="gyroOrientations"
                ></input-select>
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
import { useConstantStore } from "@/store/constants";
import { useProfileStore } from "@/store/profile";

export default defineComponent({
  name: "BoardOrientationSettings",
  setup() {
    return {
      constants: useConstantStore(),
      profile: useProfileStore(),
    };
  },
  computed: {
    gyroOrientation: {
      get() {
        return this.profile.motor.gyro_orientation & 0x1f;
      },
      set(value) {
        this.profile.motor.gyro_orientation =
          value | (this.gyroFlip ? this.constants.GyroRotation.FLIP_180 : 0x0);
      },
    },
    gyroOrientations() {
      return [
        { value: this.constants.GyroRotation.ROTATE_NONE, text: "ROTATE_NONE" },
        {
          value: this.constants.GyroRotation.ROTATE_45_CCW,
          text: "ROTATE_45_CCW",
        },
        {
          value: this.constants.GyroRotation.ROTATE_45_CW,
          text: "ROTATE_45_CW",
        },
        {
          value: this.constants.GyroRotation.ROTATE_90_CW,
          text: "ROTATE_90_CW",
        },
        {
          value: this.constants.GyroRotation.ROTATE_90_CCW,
          text: "ROTATE_90_CCW",
        },
        {
          value:
            this.constants.GyroRotation.ROTATE_90_CCW |
            this.constants.GyroRotation.ROTATE_45_CCW,
          text: "ROTATE_135_CW",
        },
        {
          value:
            this.constants.GyroRotation.ROTATE_90_CW |
            this.constants.GyroRotation.ROTATE_45_CW,
          text: "ROTATE_135_CCW",
        },
        { value: this.constants.GyroRotation.ROTATE_180, text: "ROTATE_180" },
      ];
    },
    gyroFlip: {
      get() {
        return (
          (this.profile.motor.gyro_orientation &
            this.constants.GyroRotation.FLIP_180) >
          0
        );
      },
      set(value) {
        this.profile.motor.gyro_orientation =
          this.gyroOrientation |
          (value ? this.constants.GyroRotation.FLIP_180 : 0x0);
      },
    },
  },
});
</script>
