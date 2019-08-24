<template>
  <b-container class="mt-5">
    <b-row>
      <b-col sm="6">
        <Setup></Setup>
        <PIDRates class="my-3"></PIDRates>
      </b-col>
      <b-col sm="6">
        <Rates></Rates>
      </b-col>
    </b-row>
    <b-row class="my-5">
      <b-col offset="11" sm="1">
        <b-button v-on:click="apply_profile(profile)">Apply</b-button>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import Setup from "@/components/Setup";
import PIDRates from "@/components/PIDRates";
import Rates from "@/components/Rates";

import { mapActions, mapState } from "vuex";

export default {
  name: "home",
  components: {
    Setup,
    Rates,
    PIDRates
  },
  computed: mapState(["profile"]),
  methods: {
    ...mapActions(["fetch_profile", "apply_profile"])
  },
  created() {
    this.fetch_profile();
  }
};
</script>
