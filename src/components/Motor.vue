<template>
  <b-card>
    <h5 slot="header" class="mb-0">Motor</h5>
    <b-row>
      <b-col sm="6">
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="invert-yaw">
              Invert Yaw
              <tooltip entry="motor.invert_yaw" />
            </label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-select
              id="invert-yaw"
              v-model.number="motor.invert_yaw"
              :options="invertYawModes"
            ></b-form-select>
          </b-col>
        </b-row>
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="digital-idle">
              Digital Idle
              <tooltip entry="motor.digital_idle" />
            </label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-input
              id="digital-idle"
              type="number"
              step="0.1"
              v-model.number="motor.digital_idle"
            ></b-form-input>
          </b-col>
        </b-row>
        <b-row
          v-if="
            info.quic_protocol_version > 1 && has_feature(Features.BRUSHLESS)
          "
        >
          <b-col sm="4" class="my-2">
            <label for="dshot-time">
              DShot Time
              <tooltip entry="motor.dshot_time" />
            </label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-select
              id="dshot-time"
              v-model="motor.dshot_time"
              :options="dshotTimes"
            ></b-form-select>
          </b-col>
        </b-row>
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="gyro-flip">
              Flip Gyro
              <tooltip entry="motor.flip_gyro" />
            </label>
          </b-col>
          <b-col sm="8" class="my-2">
            <div class="custom-control custom-checkbox">
              <input
                type="checkbox"
                class="custom-control-input"
                id="gyro-flip"
                v-model="gyroFlip"
              />
              <label class="custom-control-label" for="gyro-flip">Enable</label>
            </div>
          </b-col>
        </b-row>
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="gyro-orientation">
              Gyro Orientation
              <tooltip entry="motor.gyro_orientation" />
            </label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-select
              id="gyro-orientation"
              v-model="gyroOrientation"
              :options="gyroOrientations"
            ></b-form-select>
          </b-col>
        </b-row>
      </b-col>
      <b-col sm="6">
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="torque-boost">
              Torque Boost
              <tooltip entry="motor.torque_boost" />
            </label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-input
              id="torque-boost"
              type="number"
              step="0.1"
              v-model.number="motor.torque_boost"
            ></b-form-input>
          </b-col>
        </b-row>
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="throttle-boost">
              Throttle Boost
              <tooltip entry="motor.throttle_boost" />
            </label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-input
              id="throttle-boost"
              type="number"
              step="0.1"
              v-model.number="motor.throttle_boost"
            ></b-form-input>
          </b-col>
        </b-row>
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="turtle-throttle-percent">
              Turtle Throttle Percent
              <tooltip entry="motor.turtle_throttle_percent" />
            </label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-input
              id="turtle-throttle-percent"
              type="number"
              step="1"
              v-model.number="motor.turtle_throttle_percent"
            ></b-form-input>
          </b-col>
        </b-row>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import { mapFields } from "@/store/helper.js";
import { mapGetters, mapState } from "vuex";
import { Features, GyroRotation } from "@/store/constants";

export default {
  name: "Motor",
  data() {
    return {
      Features,

      invertYawModes: [
        { value: 0, text: "Props In" },
        { value: 1, text: "Props Out" },
      ],
      gyroOrientations: [
        { value: GyroRotation.ROTATE_NONE, text: "ROTATE_NONE" },
        { value: GyroRotation.ROTATE_45_CCW, text: "ROTATE_45_CCW" },
        { value: GyroRotation.ROTATE_45_CW, text: "ROTATE_45_CW" },
        { value: GyroRotation.ROTATE_90_CW, text: "ROTATE_90_CW" },
        { value: GyroRotation.ROTATE_90_CCW, text: "ROTATE_90_CCW" },
        {
          value: GyroRotation.ROTATE_90_CCW | GyroRotation.ROTATE_45_CCW,
          text: "ROTATE_135_CW",
        },
        {
          value: GyroRotation.ROTATE_90_CW | GyroRotation.ROTATE_45_CW,
          text: "ROTATE_135_CCW",
        },
        { value: GyroRotation.ROTATE_180, text: "ROTATE_180" },
      ],
      dshotTimes: [
        { value: 150, text: "150" },
        { value: 300, text: "300" },
        { value: 600, text: "600" },
      ],
    };
  },
  computed: {
    ...mapFields("profile", ["motor"]),
    ...mapGetters(["has_feature"]),
    ...mapState(["info"]),
    gyroOrientation: {
      get() {
        return this.motor.gyro_orientation & 0x1f;
      },
      set(value) {
        this.motor.gyro_orientation =
          value | (this.gyroFlip ? GyroRotation.FLIP_180 : 0x0);
      },
    },
    gyroFlip: {
      get() {
        return (this.motor.gyro_orientation & GyroRotation.FLIP_180) > 0;
      },
      set(value) {
        this.motor.gyro_orientation =
          this.gyroOrientation | (value ? GyroRotation.FLIP_180 : 0x0);
      },
    },
  },
};
</script>

<style scoped>
</style>
