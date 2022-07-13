<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Motor</p>
    </header>

    <div class="card-content">
      <div class="content column-narrow field-is-5">
        <div class="columns">
          <div class="column is-6">
            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label">
                  Invert Yaw
                  <tooltip entry="motor.invert_yaw" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      id="invert-yaw"
                      class="is-fullwidth"
                      v-model.number="profile.motor.invert_yaw"
                      :options="invertYawModes"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label">
                  Digital Idle
                  <tooltip entry="motor.digital_idle" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      class="input"
                      id="digital-idle"
                      type="number"
                      step="0.1"
                      v-model.number="profile.motor.digital_idle"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              class="field is-horizontal"
              v-if="
                info.quic_protocol_version > 1 &&
                info.has_feature(constants.Features.BRUSHLESS)
              "
            >
              <div class="field-label">
                <label class="label">
                  DShot Time
                  <tooltip entry="motor.dshot_time" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      id="dshot-time"
                      class="is-fullwidth"
                      v-model="profile.motor.dshot_time"
                      :options="dshotTimes"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>

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
                    <label class="checkbox">
                      <input type="checkbox" id="gyro-flip" v-model="gyroFlip" />
                      Enable
                    </label>
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
                      class="is-fullwidth"
                      id="gyro-orientation"
                      v-model="gyroOrientation"
                      :options="gyroOrientations"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="column is-6">
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
                      class="input"
                      id="torque-boost"
                      type="number"
                      step="0.1"
                      v-model.number="profile.motor.torque_boost"
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
                      class="input"
                      id="throttle-boost"
                      type="number"
                      step="0.1"
                      v-model.number="profile.motor.throttle_boost"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label">
                  Turtle Throttle Percent
                  <tooltip entry="motor.turtle_throttle_percent" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      class="input"
                      id="turtle-throttle-percent"
                      type="number"
                      step="1"
                      v-model.number="profile.motor.turtle_throttle_percent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal" v-if="profile.profileVersionGt('0.2.0')">
              <div class="field-label">
                <label class="label">
                  Motor Limit Percent
                  <tooltip entry="motor.motor_limit" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      class="input"
                      id="motor-limit-percent"
                      type="number"
                      step="1"
                      v-model.number="profile.motor.motor_limit"
                    />
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
import { useConstantStore } from "@/store/constants";

export default defineComponent({
  name: "Motor",
  setup() {
    return {
      profile: useProfileStore(),
      info: useInfoStore(),
      constants: useConstantStore(),
    };
  },
  data() {
    return {
      invertYawModes: [
        { value: 0, text: "Props In" },
        { value: 1, text: "Props Out" },
      ],

      dshotTimes: [
        { value: 150, text: "150" },
        { value: 300, text: "300" },
        { value: 600, text: "600" },
      ],
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
          (this.profile.motor.gyro_orientation & this.constants.GyroRotation.FLIP_180) > 0
        );
      },
      set(value) {
        this.profile.motor.gyro_orientation =
          this.gyroOrientation | (value ? this.constants.GyroRotation.FLIP_180 : 0x0);
      },
    },
  },
});
</script>

<style scoped></style>
