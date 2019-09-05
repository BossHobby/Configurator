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
            <b-form-select :id="func" v-model.number="Channel.Aux[index]" :options="auxChannels"></b-form-select>
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
import { get } from "@/api.js";

export default {
  name: "Channels",
  components: {},
  computed: {
    ...mapState({
      Channel: state => state.profile.Channel
    })
  },
  data() {
    return {
      aux: [],
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
        { value: 13, text: "AUX_14" },
        { value: 14, text: "ON" },
        { value: 15, text: "OFF" }
      ],
      auxFunctions: [
        "AUX_ARMING",
        "AUX_IDLE_UP",
        "AUX_LEVELMODE",
        "AUX_RACEMODE",
        "AUX_HORIZON",
        "AUX_PIDPROFILE",
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
      if (this.Channel.Aux[index] == 15) return "text-danger";
      if (this.Channel.Aux[index] == 14) return "text-success";
      if (this.aux[this.Channel.Aux[index]]) return "text-success";
      return "";
    }
  },
  created() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    get("/api/rx").then(res => (this.aux = res.aux));
    this.interval = setInterval(() => {
      get("/api/rx").then(res => (this.aux = res.aux));
    }, 750);
  },
  destroyed() {
    clearInterval(this.interval);
  }
};
</script>

<style scoped>
</style>
