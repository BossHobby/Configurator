<template>
  <b-container>
    <b-row>
      <b-col sm="12" class="my-4">
        <b-card>
          <h5 slot="header" class="mb-0">
            Motor Test
            <b-button
              size="sm"
              class="my-2 mx-2"
              @click="motor_test_toggle()"
            >{{ motor_test.active ? "Disable" : "Enable"}}</b-button>
            <small class="float-right my-3">{{(blackbox.vbat_filter / 10).toPrecision(3)}}V</small>
          </h5>
          <div>
            <b-row>
              <b-col sm="2" class="my-2">
                <label for="MOTOR_FL">Front Left</label>
              </b-col>
              <b-col sm="3" class="my-2">
                <b-form-input
                  id="MOTOR_FL"
                  type="range"
                  step="1"
                  min="0"
                  max="100"
                  v-model.number="value[1]"
                  @change="update()"
                ></b-form-input>
              </b-col>
              <b-col sm="1">
                <b-form-input
                  id="MOTOR_FL"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  v-model.number="value[1]"
                  @change="update()"
                ></b-form-input>
              </b-col>

              <b-col sm="2" class="my-2">
                <label for="MOTOR_FR">Front Right</label>
              </b-col>
              <b-col sm="3" class="my-2">
                <b-form-input
                  id="MOTOR_FR"
                  type="range"
                  step="1"
                  min="0"
                  max="100"
                  v-model.number="value[3]"
                  @change="update()"
                ></b-form-input>
              </b-col>
              <b-col sm="1">
                <b-form-input
                  id="MOTOR_FR"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  v-model.number="value[3]"
                  @change="update()"
                ></b-form-input>
              </b-col>
            </b-row>

            <b-row>
              <b-col sm="2" class="my-2">
                <label for="MOTOR_BL">Back Left</label>
              </b-col>
              <b-col sm="3" class="my-2">
                <b-form-input
                  id="MOTOR_BL"
                  type="range"
                  step="1"
                  min="0"
                  max="100"
                  v-model.number="value[0]"
                  @change="update()"
                ></b-form-input>
              </b-col>
              <b-col sm="1">
                <b-form-input
                  id="MOTOR_BL"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  v-model.number="value[0]"
                  @change="update()"
                ></b-form-input>
              </b-col>

              <b-col sm="2" class="my-2">
                <label for="MOTOR_BR">Back Right</label>
              </b-col>
              <b-col sm="3" class="my-2">
                <b-form-input
                  id="MOTOR_BR"
                  type="range"
                  step="1"
                  min="0"
                  max="100"
                  v-model.number="value[2]"
                  @change="update()"
                ></b-form-input>
              </b-col>
              <b-col sm="1">
                <b-form-input
                  id="MOTOR_BR"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  v-model.number="value[2]"
                  @change="update()"
                ></b-form-input>
              </b-col>
            </b-row>
          </div>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { mapActions, mapState } from "vuex";

export default {
  name: "motor",
  components: {},
  data() {
    return {};
  },
  computed: {
    ...mapState(["motor_test", "blackbox"]),
    value() {
      return this.motor_test.value.map(v => v * 100);
    }
  },
  methods: {
    ...mapActions([
      "fetch_motor_test",
      "motor_test_toggle",
      "motor_test_set_value"
    ]),
    update() {
      return this.motor_test_set_value(this.value.map(v => v / 100));
    }
  },
  created() {
    this.fetch_motor_test();
  }
};
</script>
