<template>
  <div class="columns is-multiline">
    <div class="column my-4 is-12" v-if="motor.test">
      <div class="card">
        <header class="card-header">
          <p class="card-header-title">Motor Test</p>
          <small class="card-header-icon">
            {{ vbat.toPrecision(3) }}V <br />
            {{ state.ibat_filtered }}mAh
          </small>
          <tooltip class="card-header-icon" entry="motor.test" />
        </header>

        <div>
          <div class="columns is-multiline" v-if="motor.test.active">
            <div class="column is-6 my-2 px-5" v-for="m in motors" :key="m.index">
              <div class="columns is-multiline">
                <div class="column is-3 my-2">
                  <label :for="m.id">
                    <h6>{{ m.label }}</h6>
                  </label>
                </div>
                <div class="column is-7 my-2">
                  <input
                    class="input"
                    :id="m.id"
                    type="range"
                    step="1"
                    min="0"
                    max="50"
                    v-model.number="value[m.index]"
                    @update="update()"
                  />
                </div>
                <div class="column is-2 px-1">
                  <input
                    class="input"
                    :id="m.id"
                    type="number"
                    step="1"
                    min="0"
                    max="50"
                    v-model.number="value[m.index]"
                    @change="update()"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="columns" v-else>
            <div class="column is-12">
              <h6 class="text-muted">Motor Test disabled</h6>
            </div>
          </div>
          <div class="columns">
            <div class="column is-offset-10 is-2">
              <button class="button my-2 mx-2 float-right" @click="motor_test_toggle()">
                {{ motor.test.active ? "Disable" : "Enable" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="column is-12 my-4">
      <div class="card my-2">
        <header class="card-header">
          <p class="card-header-title">Motor Pins</p>
          <tooltip class="card-header-icon" entry="motor_pins" />
        </header>

        <div class="columns is-multiline my-2">
          <div
            class="column is-6 my-2 px-5"
            v-for="m in motors"
            :key="'motor-pin-' + m.index"
          >
            <div class="columns is-multiline">
              <div class="column is-4">
                <label :for="'motor-pin-' + m.index">
                  <h6>
                    {{ m.label }}
                    <br />
                    <span class="text-muted">Motor {{ m.index }}</span>
                  </h6>
                </label>
              </div>
              <div class="column is-8" v-if="profile_motor.motor_pins">
                <input-select
                  :id="'motor-pin-' + m.index"
                  v-model="profile_motor.motor_pins[m.index]"
                  :options="motorPins"
                ></input-select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="column is-12 my-4" v-if="has_feature(Features.BRUSHLESS)">
      <div class="card">
        <header class="card-header">
          <p class="card-header-title">ESC Settings</p>
          <tooltip class="card-header-icon" entry="motor_settings" />
        </header>

        <div class="card-content">
          <div class="content">
            <div
              class="columns is-multiline"
              v-if="motor.settings && motor.settings.length"
            >
              <div
                class="column is-6 my-2 px-5"
                v-for="m in motors"
                :key="'motor-settings-' + m.index"
              >
                <div class="columns is-multiline">
                  <div class="column is-4 my-2">
                    <h6>{{ m.label }}</h6>
                  </div>
                  <div class="column is-8 my-2">
                    {{ trim(motor.settings[m.index].LAYOUT) }}
                    -
                    {{ trim(motor.settings[m.index].NAME) }},
                    {{ motor.settings[m.index].MAIN_REVISION }}.{{
                      motor.settings[m.index].SUB_REVISION
                    }}
                  </div>

                  <div class="column is-4 my-2">
                    <label :for="'motor-direction-' + m.index">Direction</label>
                  </div>
                  <div class="column is-8 my-2">
                    <input-select
                      id="direction"
                      v-model.number="motor.settings[m.index].MOTOR_DIRECTION"
                      :options="motor_direction_options"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>
            <div class="columns is-multiline">
              <div class="column is-offset-10 is-2">
                <spinner-btn
                  class="ml-4 mt-2"
                  v-if="motor.settings && motor.settings.length"
                  :disabled="motor.loading"
                  v-on:click="apply_motor_settings(motor.settings)"
                >
                  Apply
                </spinner-btn>
                <spinner-btn
                  class="ml-4 mt-2"
                  v-else
                  :disabled="motor.loading"
                  v-on:click="fetch_motor_settings()"
                >
                  Load
                </spinner-btn>
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
import { mapActions, mapState, mapGetters } from "vuex";
import { mapFields } from "@/store/helper.js";

export default defineComponent({
  name: "motor",
  components: {},
  data() {
    return {
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
    ...mapGetters(["has_feature", "vbat"]),
    ...mapState("constants", ["Features"]),
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
});
</script>
