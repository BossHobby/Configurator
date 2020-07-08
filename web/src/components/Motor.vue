<template>
  <b-card>
    <h5 slot="header" class="mb-0">Motor</h5>
    <b-row>
      <b-col sm="6">
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="invert-yaw">Invert Yaw</label>
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
            <label for="digital-idle">Digital Idle</label>
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
        <b-row v-if="status.Info.quic_protocol_version > 1 && has_feature(FEATURE_BRUSHLESS)">
          <b-col sm="4" class="my-2">
            <label for="dshot-time">DShot Time</label>
          </b-col>
          <b-col sm="8" class="my-2">
            <b-form-select id="dshot-time" v-model="motor.dshot_time" :options="dshotTimes"></b-form-select>
          </b-col>
        </b-row>
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="gyro-flip">Flip Gyro</label>
          </b-col>
          <b-col sm="8" class="my-2">
            <div class="custom-control custom-checkbox">
              <input type="checkbox" class="custom-control-input" id="gyro-flip" v-model="gyroFlip" />
              <label class="custom-control-label" for="gyro-flip">Enable</label>
            </div>
          </b-col>
        </b-row>
        <b-row>
          <b-col sm="4" class="my-2">
            <label for="gyro-orientation">Gyro Orientation</label>
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
            <label for="torque-boost">Torque Boost</label>
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
            <label for="throttle-boost">Throttle Boost</label>
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
            <label for="turtle-throttle-percent">Turtle Throttle Percent</label>
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
import { FEATURE_BRUSHLESS } from "@/store/constants.js";

const GYRO_ROTATE_NONE = 0x0;
const GYRO_ROTATE_45_CCW = 0x1;
const GYRO_ROTATE_45_CW = 0x2;
const GYRO_ROTATE_90_CW = 0x4;
const GYRO_ROTATE_90_CCW = 0x8;
const GYRO_ROTATE_180 = 0x10;
const GYRO_FLIP_180 = 0x20;

export default {
  name: "Motor",
  data() {
    return {
      FEATURE_BRUSHLESS,

      invertYawModes: [
        { value: 0, text: "Props In" },
        { value: 1, text: "Props Out" }
      ],
      gyroOrientations: [
        { value: GYRO_ROTATE_NONE, text: "ROTATE_NONE" },
        { value: GYRO_ROTATE_45_CCW, text: "ROTATE_45_CCW" },
        { value: GYRO_ROTATE_45_CW, text: "ROTATE_45_CW" },
        { value: GYRO_ROTATE_90_CW, text: "ROTATE_90_CW" },
        { value: GYRO_ROTATE_90_CCW, text: "ROTATE_90_CCW" },
        {
          value: GYRO_ROTATE_90_CCW | GYRO_ROTATE_45_CCW,
          text: "ROTATE_135_CW"
        },
        {
          value: GYRO_ROTATE_90_CW | GYRO_ROTATE_45_CW,
          text: "ROTATE_135_CCW"
        },
        { value: GYRO_ROTATE_180, text: "ROTATE_180" }
      ],
      dshotTimes: [
        { value: 150, text: "150" },
        { value: 300, text: "300" },
        { value: 600, text: "600" }
      ]
    };
  },
  computed: {
    ...mapFields("profile", ["motor"]),
    ...mapGetters(["has_feature"]),
    ...mapState(["status"]),
    gyroOrientation: {
      get() {
        return this.motor.gyro_orientation & 0x1f;
      },
      set(value) {
        this.motor.gyro_orientation =
          value | (this.gyroFlip ? GYRO_FLIP_180 : 0x0);
      }
    },
    gyroFlip: {
      get() {
        return (this.motor.gyro_orientation & GYRO_FLIP_180) > 0;
      },
      set(value) {
        this.motor.gyro_orientation =
          this.gyroOrientation | (value ? GYRO_FLIP_180 : 0x0);
      }
    }
  }
};
</script>

<style scoped>
</style>
