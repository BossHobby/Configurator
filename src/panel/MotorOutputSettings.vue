<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Motor Output Settings</p>
    </header>

    <div class="card-content">
      <div class="content column-narrow field-is-5">
        <div v-if="!info.is_rover" class="columns is-variable is-5">
          <div class="column is-5 has-text-centered">
            <h4>
              Props {{ profile.motor.invert_yaw ? "Out" : "In" }}
              <tooltip entry="motor.invert_yaw" />
            </h4>

            <svg
              class="prop-direction-graphic"
              viewBox="0 0 135.46665 135.46665"
              role="img"
              :aria-label="profile.motor.invert_yaw ? 'Props out' : 'Props in'"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                class="frame"
                d="M 108.49869,108.49869 26.967982,26.967982"
              />
              <path
                class="frame"
                d="M 26.967982,108.49869 108.49869,26.967982"
              />

              <g
                v-for="prop in propDirectionMarkers"
                :key="prop.label"
                class="prop-marker"
                :transform="prop.transform"
              >
                <circle cx="33.959526" cy="101.60001" r="13.229167" />
                <path :d="prop.arrowA" />
                <path :d="prop.arrowB" />
              </g>
            </svg>
          </div>

          <div class="column">
            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label">
                  Prop Direction
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
            !info.is_rover &&
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

        <div v-if="!info.is_rover" class="field is-horizontal">
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
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useConstantStore } from "@/store/constants";
import { useInfoStore } from "@/store/info";
import { useProfileStore } from "@/store/profile";

export default defineComponent({
  name: "MotorOutputSettings",
  setup() {
    return {
      constants: useConstantStore(),
      info: useInfoStore(),
      profile: useProfileStore(),
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
    propDirectionMarkers() {
      const propsIn = [
        {
          label: "props-in-bl",
          transform: "matrix(1.2037011,0,0,1.2037011,-13.909145,-13.640148)",
        },
        {
          label: "props-in-fr",
          transform: "matrix(-1.2037011,0,0,-1.2037011,149.37581,149.26403)",
        },
        {
          label: "props-in-br",
          transform: "matrix(-1.2037013,0,0,1.2037013,149.37582,-13.797383)",
        },
        {
          label: "props-in-fl",
          transform: "matrix(1.2037013,0,0,-1.2037013,-13.829304,149.26404)",
        },
      ];
      const propsOut = [
        {
          label: "props-out-fl",
          transform: "matrix(1.2037013,0,0,-1.2037013,-13.909145,149.65895)",
        },
        {
          label: "props-out-fr",
          transform: "matrix(-1.2037011,0,0,-1.2037011,149.37581,149.26403)",
        },
        {
          label: "props-out-br",
          transform: "matrix(-1.2037013,0,0,1.2037013,149.37582,-13.988638)",
        },
        {
          label: "props-out-bl",
          transform: "matrix(1.2037011,0,0,1.2037011,-13.909145,-13.842473)",
        },
      ];

      const clockwiseArrow = {
        arrowA: "m 25.42414,111.81499 0.346888,-6.75997",
        arrowB: "m 25.42414,111.81499 -6.759978,0.34689",
      };
      const counterClockwiseArrow = {
        arrowA: "m 22.533776,108.2281 -0.34689,6.75997",
        arrowB: "m 22.533776,108.2281 6.75997,-0.34689",
      };

      return (this.profile.motor.invert_yaw ? propsOut : propsIn).map(
        (prop) => ({
          ...prop,
          ...(this.profile.motor.invert_yaw
            ? counterClockwiseArrow
            : clockwiseArrow),
        }),
      );
    },
  },
});
</script>

<style lang="scss" scoped>
.prop-direction-graphic {
  max-width: 400px;
  width: 100%;
}

.frame {
  fill: none;
  stroke: #7a7a7a;
  stroke-linecap: round;
  stroke-width: 11.1468;
}

.prop-marker {
  fill: none;
  stroke-width: 2.64583;
}

.prop-marker circle {
  stroke: #62a834;
}

.prop-marker path {
  stroke: #7a7a7a;
  stroke-linecap: round;
}
</style>
