<template>
  <b-container>
    <b-row>
      <b-col sm="12" class="my-4">
        <b-card>
          <h5 slot="header" class="mb-0">
            Motor
            <b-button
              size="sm"
              class="my-2 mx-2"
              @click="motor_test_toggle()"
            >{{ motor_test.active ? "Disable" : "Enable"}}</b-button>
            <small class="float-right">{{(blackbox.vbat_filter / 10).toPrecision(3)}}V</small>
          </h5>
          <div>
            <b-row>
              <b-col sm="4" class="my-2">
                <label for="MOTOR_BL">MOTOR_BL</label>
              </b-col>
              <b-col sm="8" class="my-2">
                <b-form-input
                  id="MOTOR_BL"
                  type="number"
                  :step="step"
                  min="0"
                  max="100"
                  v-model.number="value[0]"
                  @change="update()"
                ></b-form-input>
              </b-col>
            </b-row>

            <b-row>
              <b-col sm="4" class="my-2">
                <label for="MOTOR_FL">MOTOR_FL</label>
              </b-col>
              <b-col sm="8" class="my-2">
                <b-form-input
                  id="MOTOR_FL"
                  type="number"
                  :step="step"
                  min="0"
                  max="100"
                  v-model.number="value[1]"
                  @change="update()"
                ></b-form-input>
              </b-col>
            </b-row>

            <b-row>
              <b-col sm="4" class="my-2">
                <label for="MOTOR_BR">MOTOR_BR</label>
              </b-col>
              <b-col sm="8" class="my-2">
                <b-form-input
                  id="MOTOR_BR"
                  type="number"
                  :step="step"
                  min="0"
                  max="100"
                  v-model.number="value[2]"
                  @change="update()"
                ></b-form-input>
              </b-col>
            </b-row>

            <b-row>
              <b-col sm="4" class="my-2">
                <label for="MOTOR_FR">MOTOR_FR</label>
              </b-col>
              <b-col sm="8" class="my-2">
                <b-form-input
                  id="MOTOR_FR"
                  type="number"
                  :step="step"
                  min="0"
                  max="100"
                  v-model.number="value[3]"
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
    return {
      step: 1
    };
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
