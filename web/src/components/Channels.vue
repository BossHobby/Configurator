<template>
  <b-card>
    <h5 slot="header" class="mb-0">Channels</h5>
    <b-row>
      <b-col sm="8">
        <b-row v-for="(func, index) in auxFunctions" :key="func">
          <b-col sm="6" class="my-1">
            <label :for="func" :class="classForIndex(index)">{{ func }}</label>
          </b-col>
          <b-col sm="3" class="my-1">
            <b-form-select
              :id="func"
              v-model.number="receiver_aux[index]"
              :options="auxChannels"
            ></b-form-select>
          </b-col>
        </b-row>
      </b-col>
      <b-col offset="0" sm="4">
        <b-card>
          <h6 slot="header" class="mb-0">Current AUX State</h6>
          <b-row v-for="(v, index) in auxChannels" :key="v.text">
            <b-col sm="6" class="my-1">{{ v.text }}</b-col>
            <b-col
              sm="6"
              class="my-1"
              :class="valueForIndex(index) ? 'text-success' : 'text-danger'"
              >{{ valueForIndex(index) ? "ON" : "OFF" }}</b-col
            >
          </b-row>
        </b-card>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import { mapState } from "vuex";
import { mapFields } from "@/store/helper.js";

export default {
  name: "Channels",
  components: {},
  computed: {
    ...mapFields("profile", ["receiver.aux"]),
    ...mapState({
      aux: (state) => state.state.aux,
    }),
  },
  data() {
    return {
      auxChannels: [
        { value: 0, text: "CHANNEL_5" },
        { value: 1, text: "CHANNEL_6" },
        { value: 2, text: "CHANNEL_7" },
        { value: 3, text: "CHANNEL_8" },
        { value: 4, text: "CHANNEL_9" },
        { value: 5, text: "CHANNEL_10" },
        { value: 6, text: "CHANNEL_11" },
        { value: 7, text: "CHANNEL_12" },
        { value: 8, text: "CHANNEL_13" },
        { value: 9, text: "CHANNEL_14" },
        { value: 10, text: "CHANNEL_15" },
        { value: 11, text: "CHANNEL_16" },
        { value: 12, text: "OFF" },
        { value: 13, text: "ON" },
        { value: 14, text: "AUX_GESTURE" },
      ],
      auxFunctions: [
        "AUX_ARMING",
        "AUX_IDLE_UP",
        "AUX_LEVELMODE",
        "AUX_RACEMODE",
        "AUX_HORIZON",
        "AUX_STICK_BOOST_PROFILE",
        "AUX_TRAVEL_CHECK",
        "AUX_HIGH_RATES",
        "AUX_LEDS_ON",
        "AUX_BUZZER_ENABLE",
        "AUX_TURTLE",
        "AUX_MOTORS_TO_THROTTLE_MODE",
        "AUX_RSSI",
        "AUX_FPV_ON",
        "AUX_BLACKBOX",
      ],
    };
  },
  methods: {
    valueForIndex(index) {
      return this.aux[index];
    },
    classForIndex(index) {
      if (!this.channel_aux) {
        return "";
      }

      if (this.channel_aux[index] == 12) return "text-danger";
      if (this.channel_aux[index] == 13) return "text-success";
      if (this.valueForIndex(this.channel_aux[index])) {
        return "text-success";
      }
      return "";
    },
  },
};
</script>
