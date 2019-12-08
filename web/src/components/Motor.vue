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
      <b-col sm="6">
        <b-card class="my-2">
          <h6 slot="header" class="mb-0">Motor Pins</h6>
          <b-row class="my-2" v-for="(name, index) in motorNames" :key="'motor-pin-' + index">
            <b-col sm="4">
              <label :for="'motor-pin-' + index">{{name}}</label>
            </b-col>
            <b-col sm="8" v-if="motor.motor_pins">
              <b-form-select
                :id="'motor-pin-' + index"
                v-model="motor.motor_pins[index]"
                :options="motorPins"
              ></b-form-select>
            </b-col>
          </b-row>
        </b-card>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "Motor",
  data() {
    return {
      invertYawModes: [
        { value: 0, text: "Props In" },
        { value: 1, text: "Props Out" }
      ],
      gyroOrientations: [
        { value: 0, text: "ROTATE_NONE" },
        { value: 1, text: "ROTATE_45_CCW" },
        { value: 2, text: "ROTATE_45_CW" },
        { value: 4, text: "ROTATE_90_CW" },
        { value: 8, text: "ROTATE_90_CCW" },
        { value: 16, text: "ROTATE_180" }
      ],
      motorNames: [
        "Motor 0 (BL)",
        "Motor 1 (FL)",
        "Motor 2 (BR)",
        "Motor 3 (FR)"
      ]
    };
  },
  computed: {
    ...mapState({
      motor: state => state.profile.motor,
      motor_pins: state => state.status.Info.motor_pins
    }),
    gyroOrientation: {
      get() {
        return this.motor.gyro_orientation & 0x1f;
      },
      set(value) {
        this.motor.gyro_orientation = value | (this.gyroFlip ? 0x20 : 0x0);
      }
    },
    gyroFlip: {
      get() {
        return (this.motor.gyro_orientation & 0x20) > 0;
      },
      set(value) {
        this.motor.gyro_orientation =
          this.gyroOrientation | (value ? 0x20 : 0x0);
      }
    },
    motorPins() {
      return this.motor_pins.map((v, i) => {
        return {
          value: i,
          text: `Pin ${i} (${v})`
        };
      });
    }
  }
};
</script>

<style scoped>
</style>
