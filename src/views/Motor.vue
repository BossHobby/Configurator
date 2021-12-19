<template>
  <b-container>
    <b-row>
      <b-col v-if="motor.test" sm="12" class="my-4">
        <b-card>
          <h5 slot="header" class="mb-0">
            Motor Test
            <b-button
              size="sm"
              class="my-2 mx-2"
              @click="motor_test_toggle()"
              >{{ motor.test.active ? "Disable" : "Enable" }}</b-button
            >
            <small class="float-right my-3"
              >{{ state.vbattfilt.toPrecision(3) }}V</small
            >
          </h5>
          <div>
            <b-row v-if="motor.test.active">
              <b-col
                v-for="m in motors"
                :key="m.index"
                sm="6"
                class="my-2 px-5"
              >
                <b-row>
                  <b-col sm="3" class="my-2">
                    <label :for="m.id">
                      <h6>{{ m.label }}</h6>
                    </label>
                  </b-col>
                  <b-col sm="7" class="my-2">
                    <b-form-input
                      :id="m.id"
                      type="range"
                      step="1"
                      min="0"
                      max="50"
                      v-model.number="value[m.index]"
                      @update="update()"
                    ></b-form-input>
                  </b-col>
                  <b-col sm="2" class="px-1">
                    <b-form-input
                      :id="m.id"
                      type="number"
                      step="1"
                      min="0"
                      max="50"
                      v-model.number="value[m.index]"
                      @change="update()"
                    ></b-form-input>
                  </b-col>
                </b-row>
              </b-col>
            </b-row>
            <b-row v-else>
              <b-col sm="12">
                <h6 class="text-muted">Motor Test disabled</h6>
              </b-col>
            </b-row>
          </div>
        </b-card>
      </b-col>
      <b-col sm="12" class="my-4">
        <b-card class="my-2">
          <h5 slot="header" class="mb-0">Motor Pins</h5>
          <b-row class="my-2">
            <b-col
              v-for="m in motors"
              :key="'motor-pin-' + m.index"
              sm="6"
              class="my-2 px-5"
            >
              <b-row>
                <b-col sm="4">
                  <label :for="'motor-pin-' + m.index">
                    <h6>
                      {{ m.label }}
                      <br />
                      <span class="text-muted">Motor {{ m.index }}</span>
                    </h6>
                  </label>
                </b-col>
                <b-col sm="8" v-if="profile_motor.motor_pins">
                  <b-form-select
                    :id="'motor-pin-' + m.index"
                    v-model="profile_motor.motor_pins[m.index]"
                    :options="motorPins"
                  ></b-form-select>
                </b-col>
              </b-row>
            </b-col>
          </b-row>
        </b-card>
      </b-col>
      <b-col sm="12" class="my-4" v-if="has_feature(FEATURE_BRUSHLESS)">
        <b-card>
          <h5 slot="header" class="mb-0">ESC Settings</h5>
          <div>
            <b-row v-if="motor.settings && motor.settings.length">
              <b-col
                v-for="m in motors"
                :key="'motor-settings-' + m.index"
                sm="6"
                class="my-2 px-5"
              >
                <b-row>
                  <b-col sm="4" class="my-2">
                    <h6>{{ m.label }}</h6>
                  </b-col>
                  <b-col sm="8" class="my-2">
                    {{ trim(motor.settings[m.index].LAYOUT) }}
                    ({{ motor.settings[m.index].MAIN_REVISION }}.{{
                      motor.settings[m.index].SUB_REVISION
                    }})
                  </b-col>

                  <b-col sm="4" class="my-2">
                    <label :for="'motor-direction-' + m.index">Direction</label>
                  </b-col>
                  <b-col sm="8" class="my-2">
                    <b-form-select
                      id="direction"
                      v-model.number="motor.settings[m.index].MOTOR_DIRECTION"
                      :options="motor_direction_options"
                    ></b-form-select>
                  </b-col>
                </b-row>
              </b-col>
            </b-row>
            <b-row>
              <b-col offset="10" sm="2">
                <b-button
                  class="ml-4 mt-2"
                  v-if="motor.settings && motor.settings.length"
                  :disabled="motor.loading"
                  v-on:click="apply_motor_settings(motor.settings)"
                  >Apply</b-button
                >
                <spinner-btn
                  class="ml-4 mt-2"
                  v-else
                  :disabled="motor.loading"
                  v-on:click="fetch_motor_settings()"
                >
                  Load
                </spinner-btn>
              </b-col>
            </b-row>
          </div>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { mapActions, mapState, mapGetters } from "vuex";
import { FEATURE_BRUSHLESS } from "@/store/constants.js";
import { mapFields } from "@/store/helper.js";

export default {
  name: "motor",
  components: {},
  data() {
    return {
      FEATURE_BRUSHLESS,

      motors: [
        {
          index: 1,
          id: "MOTOR_FL",
          label: "Front Left",
        },
        {
          index: 3,
          id: "MOTOR_FR",
          label: "Front Right",
        },
        {
          index: 0,
          id: "MOTOR_BL",
          label: "Back Left",
        },
        {
          index: 2,
          id: "MOTOR_BR",
          label: "Back Right",
        },
      ],

      motor_direction_options: [
        { value: 1, text: "Normal" },
        { value: 2, text: "Reversed" },
        { value: 3, text: "Bidirectional" },
        { value: 4, text: "Bidirectional Reversed" },
      ],
    };
  },
  computed: {
    ...mapState(["motor", "state"]),
    ...mapFields("profile", { profile_motor: "motor" }),
    ...mapState({
      motor_pins: (state) => state.info.motor_pins,
    }),
    ...mapGetters(["has_feature"]),
    value() {
      return this.motor.test.value.map((v) => v * 100);
    },
    motorPins() {
      return this.motor_pins.map((v, i) => {
        return {
          value: i,
          text: `Pin ${i} (${v})`,
        };
      });
    },
  },
  methods: {
    ...mapActions([
      "fetch_motor_test",
      "fetch_motor_settings",
      "motor_test_toggle",
      "motor_test_set_value",
      "apply_motor_settings",
    ]),
    update() {
      return this.motor_test_set_value(this.value.map((v) => v / 100));
    },
    trim(str) {
      return str.replace(/#/g, "").replace(/\$/g, " ");
    },
  },
  created() {
    this.fetch_motor_test();
  },
};
</script>
