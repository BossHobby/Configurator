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
            <b-form-select :id="func" v-model.number="channel.aux[index]" :options="auxChannels"></b-form-select>
          </b-col>
        </b-row>
      </b-col>
      <b-col offset="1" sm="3">
        <b-card>
          <h6 slot="header" class="mb-0">Current AUX State</h6>
          <b-row v-for="(v, index) in aux" :key="auxChannels[index].text">
            <b-col sm="6" class="my-1">{{ auxChannels[index].text }}</b-col>
            <b-col
              sm="6"
              class="my-1"
              :class="v ? 'text-success' : 'text-danger'"
            >{{ v ? "ON" : "OFF"}}</b-col>
          </b-row>
        </b-card>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "Channels",
  components: {},
  computed: {
    ...mapState({
      channel: state => state.profile.channel,
      aux: state => state.blackbox.rx_aux
    })
  },
  data() {
    return {
      auxChannels: [
        { value: 0, text: "AUX_1" },
        { value: 1, text: "AUX_2" },
        { value: 2, text: "AUX_3" },
        { value: 3, text: "AUX_4" },
        { value: 4, text: "AUX_5" },
        { value: 5, text: "AUX_6" },
        { value: 6, text: "AUX_7" },
        { value: 7, text: "AUX_8" },
        { value: 8, text: "AUX_9" },
        { value: 9, text: "AUX_10" },
        { value: 10, text: "AUX_11" },
        { value: 11, text: "AUX_12" },
        { value: 12, text: "AUX_13" },
        { value: 13, text: "ON" },
        { value: 14, text: "OFF" }
      ],
      auxFunctions: [
        "AUX_ARMING",
        "AUX_IDLE_UP",
        "AUX_LEVELMODE",
        "AUX_RACEMODE",
        "AUX_HORIZON",
        "AUX_STICK_BOOST_PROFILE",
        "AUX_TRAVEL_CHECK",
        "AUX_RATES",
        "AUX_LEDS_ON",
        "AUX_BUZZER_ENABLE",
        "AUX_STARTFLIP",
        "AUX_FN_INVERTED",
        "AUX_MOTORS_TO_THROTTLE_MODE"
      ]
    };
  },
  methods: {
    classForIndex(index) {
      if (!this.channel || !this.channel.aux) {
        return "";
      }

      if (this.channel.aux[index] == 14) return "text-danger";
      if (this.channel.aux[index] == 13) return "text-success";
      if (this.aux[this.channel.aux[index]]) return "text-success";
      return "";
    }
  }
};
</script>

<style scoped>
</style>
