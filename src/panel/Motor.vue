<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Motor</p>
    </header>

    <div class="card-content">
      <div class="content column-narrow field-is-5">
        <div class="columns">
          <div class="column is-6">
            <div>
              <h4>
                Props {{ profile.motor.invert_yaw ? "Out" : "In" }}
                <tooltip entry="motor.invert_yaw" />
              </h4>

              <svg
                id="svg1"
                width="100%"
                style="max-width: 400px; width: 100%"
                height="400"
                viewBox="0 0 135.46665 135.46665"
                version="1.1"
                sodipodi:docname="props_view.svg"
                inkscape:version="1.3.2 (091e20ef0f, 2023-11-25, custom)"
                xml:space="preserve"
                xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
                xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:svg="http://www.w3.org/2000/svg"
              >
                <path
                  id="path1"
                  style="
                    fill: none;
                    stroke: #7a7a7a;
                    stroke-width: 11.1468;
                    stroke-linecap: round;
                    stroke-linejoin: miter;
                    stroke-dasharray: none;
                    stroke-opacity: 1;
                  "
                  d="M 108.49869,108.49869 26.967982,26.967982"
                />
                <path
                  id="path2"
                  style="
                    display: inline;
                    fill: #7a7a7a;
                    fill-opacity: 1;
                    stroke: #7a7a7a;
                    stroke-width: 11.1468;
                    stroke-linecap: round;
                    stroke-linejoin: miter;
                    stroke-dasharray: none;
                    stroke-opacity: 1;
                  "
                  d="M 26.967982,108.49869 108.49869,26.967982"
                  inkscape:label="path2"
                />
                <g
                  v-if="!profile.motor.invert_yaw"
                  id="g5"
                  style="stroke-width: 2.64583; stroke-dasharray: none"
                  transform="matrix(1.2037011,0,0,1.2037011,-13.909145,-13.640148)"
                  inkscape:label="props_in_bl"
                >
                  <circle
                    id="path4"
                    style="
                      fill: none;
                      fill-opacity: 1;
                      stroke: #62a834;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    cx="33.959526"
                    cy="101.60001"
                    r="13.229167"
                  />
                  <path
                    id="path5"
                    style="
                      fill: none;
                      stroke: #7a7a7a;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-linejoin: miter;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    d="m 25.42414,111.81499 0.346888,-6.75997"
                  />
                  <path
                    id="path5-6"
                    style="
                      fill: none;
                      stroke: #7a7a7a;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-linejoin: miter;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    d="m 25.42414,111.81499 -6.759978,0.34689"
                  />
                </g>
                <g
                  v-if="!profile.motor.invert_yaw"
                  id="g5-2"
                  transform="matrix(-1.2037011,0,0,-1.2037011,149.37581,149.26403)"
                  style="stroke-width: 2.64583; stroke-dasharray: none"
                  inkscape:label="props_in_fr"
                >
                  <circle
                    id="path4-0"
                    style="
                      fill: none;
                      fill-opacity: 1;
                      stroke: #62a834;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    cx="33.959526"
                    cy="101.60001"
                    r="13.229167"
                  />
                  <path
                    id="path5-2"
                    style="
                      fill: none;
                      stroke: #7a7a7a;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-linejoin: miter;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    d="m 25.42414,111.81499 0.346888,-6.75997"
                  />
                  <path
                    id="path5-6-3"
                    style="
                      fill: none;
                      stroke: #7a7a7a;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-linejoin: miter;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    d="m 25.42414,111.81499 -6.759978,0.34689"
                  />
                </g>
                <g
                  v-if="!profile.motor.invert_yaw"
                  id="g5-2-2"
                  transform="matrix(-1.2037013,0,0,1.2037013,149.37582,-13.797383)"
                  style="stroke-width: 2.64583; stroke-dasharray: none"
                  inkscape:label="props_in_br"
                >
                  <circle
                    id="path4-0-2"
                    style="
                      fill: none;
                      fill-opacity: 1;
                      stroke: #62a834;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    cx="33.959526"
                    cy="101.60001"
                    r="13.229167"
                  />
                  <path
                    id="path5-2-8"
                    style="
                      fill: none;
                      stroke: #7a7a7a;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-linejoin: miter;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    d="m 25.42414,111.81499 0.346888,-6.75997"
                  />
                  <path
                    id="path5-6-3-9"
                    style="
                      fill: none;
                      stroke: #7a7a7a;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-linejoin: miter;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    d="m 25.42414,111.81499 -6.759978,0.34689"
                  />
                </g>
                <g
                  v-if="!profile.motor.invert_yaw"
                  id="g5-2-1-2"
                  transform="matrix(1.2037013,0,0,-1.2037013,-13.829304,149.26404)"
                  style="
                    display: inline;
                    stroke-width: 2.64583;
                    stroke-dasharray: none;
                  "
                  inkscape:label="props_in_fl"
                >
                  <circle
                    id="path4-0-29-54"
                    style="
                      fill: none;
                      fill-opacity: 1;
                      stroke: #62a834;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    cx="33.959526"
                    cy="101.60001"
                    r="13.229167"
                  />
                  <path
                    id="path5-2-3-7"
                    style="
                      fill: none;
                      stroke: #7a7a7a;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-linejoin: miter;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    d="m 25.42414,111.81499 0.346888,-6.75997"
                  />
                  <path
                    id="path5-6-3-1-4"
                    style="
                      fill: none;
                      stroke: #7a7a7a;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-linejoin: miter;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    d="m 25.42414,111.81499 -6.759978,0.34689"
                  />
                </g>
                <g
                  v-if="profile.motor.invert_yaw"
                  id="g5-2-1"
                  transform="matrix(1.2037013,0,0,-1.2037013,-13.909145,149.65895)"
                  style="
                    display: inline;
                    stroke-width: 2.64583;
                    stroke-dasharray: none;
                  "
                  inkscape:label="props_out_fl"
                >
                  <circle
                    id="path4-0-29"
                    style="
                      fill: none;
                      fill-opacity: 1;
                      stroke: #62a834;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    cx="33.959526"
                    cy="101.60001"
                    r="13.229167"
                  />
                  <path
                    id="path5-2-3"
                    style="
                      fill: none;
                      stroke: #7a7a7a;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-linejoin: miter;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    d="m 22.533776,108.2281 -0.34689,6.75997"
                  />
                  <path
                    id="path5-6-3-1"
                    style="
                      fill: none;
                      stroke: #7a7a7a;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-linejoin: miter;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    d="m 22.533776,108.2281 6.75997,-0.34689"
                  />
                </g>
                <g
                  v-if="profile.motor.invert_yaw"
                  id="g5-2-1-8"
                  transform="matrix(-1.2037011,0,0,-1.2037011,149.37581,149.26403)"
                  style="
                    display: inline;
                    stroke-width: 2.64583;
                    stroke-dasharray: none;
                  "
                  inkscape:label="props_out_fr"
                >
                  <circle
                    id="path4-0-29-4"
                    style="
                      fill: none;
                      fill-opacity: 1;
                      stroke: #62a834;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    cx="33.959526"
                    cy="101.60001"
                    r="13.229167"
                  />
                  <path
                    id="path5-2-3-5"
                    style="
                      fill: none;
                      stroke: #7a7a7a;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-linejoin: miter;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    d="m 22.533776,108.2281 -0.34689,6.75997"
                  />
                  <path
                    id="path5-6-3-1-0"
                    style="
                      fill: none;
                      stroke: #7a7a7a;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-linejoin: miter;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    d="m 22.533776,108.2281 6.75997,-0.34689"
                  />
                </g>
                <g
                  v-if="profile.motor.invert_yaw"
                  id="g5-2-1-0"
                  transform="matrix(-1.2037013,0,0,1.2037013,149.37582,-13.988638)"
                  style="
                    display: inline;
                    stroke-width: 2.64583;
                    stroke-dasharray: none;
                  "
                  inkscape:label="props_out_br"
                >
                  <circle
                    id="path4-0-29-6"
                    style="
                      fill: none;
                      fill-opacity: 1;
                      stroke: #62a834;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    cx="33.959526"
                    cy="101.60001"
                    r="13.229167"
                  />
                  <path
                    id="path5-2-3-3"
                    style="
                      fill: none;
                      stroke: #7a7a7a;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-linejoin: miter;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    d="m 22.533776,108.2281 -0.34689,6.75997"
                  />
                  <path
                    id="path5-6-3-1-2"
                    style="
                      fill: none;
                      stroke: #7a7a7a;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-linejoin: miter;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    d="m 22.533776,108.2281 6.75997,-0.34689"
                  />
                </g>
                <g
                  v-if="profile.motor.invert_yaw"
                  id="g5-2-1-5"
                  transform="matrix(1.2037011,0,0,1.2037011,-13.909145,-13.842473)"
                  style="
                    display: inline;
                    stroke-width: 2.64583;
                    stroke-dasharray: none;
                  "
                  inkscape:label="props_out_bl"
                >
                  <circle
                    id="path4-0-29-5"
                    style="
                      fill: none;
                      fill-opacity: 1;
                      stroke: #62a834;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    cx="33.959526"
                    cy="101.60001"
                    r="13.229167"
                  />
                  <path
                    id="path5-2-3-4"
                    style="
                      fill: none;
                      stroke: #7a7a7a;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-linejoin: miter;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    d="m 22.533776,108.2281 -0.34689,6.75997"
                  />
                  <path
                    id="path5-6-3-1-7"
                    style="
                      fill: none;
                      stroke: #7a7a7a;
                      stroke-width: 2.64583;
                      stroke-linecap: round;
                      stroke-linejoin: miter;
                      stroke-dasharray: none;
                      stroke-opacity: 1;
                    "
                    d="m 22.533776,108.2281 6.75997,-0.34689"
                  />
                </g>
              </svg>
            </div>
          </div>
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
                      v-model.number="profile.motor.invert_yaw"
                      class="is-fullwidth"
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
                      id="digital-idle"
                      v-model.number="profile.motor.digital_idle"
                      class="input"
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="
                info.quic_protocol_version > 1 &&
                info.has_feature(constants.Features.BRUSHLESS)
              "
              class="field is-horizontal"
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
                      v-model="profile.motor.dshot_time"
                      class="is-fullwidth"
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
                    <input
                      id="gyro-flip"
                      v-model="gyroFlip"
                      type="checkbox"
                      class="switch"
                    />
                    <label
                      class="py-0"
                      style="height: 2em"
                      for="gyro-flip"
                    ></label>
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
                      id="turtle-throttle-percent"
                      v-model.number="profile.motor.turtle_throttle_percent"
                      class="input"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="profile.profileVersionGt('0.2.0')"
              class="field is-horizontal"
            >
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
                      id="motor-limit-percent"
                      v-model.number="profile.motor.motor_limit"
                      class="input"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
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

<style scoped></style>
