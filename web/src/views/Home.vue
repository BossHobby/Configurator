<template>
  <b-container class="mt-5">
    <b-row>
      <b-col sm="6">
        <Rates></Rates>
      </b-col>
      <b-col sm="6">
        <PIDRates></PIDRates>
      </b-col>
    </b-row>
    <b-row>
      <b-col offset="10" sm="2">
        <b-button v-on:click="apply_profile(profile)">Apply</b-button>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import PIDRates from "@/components/PIDRates";
import Rates from "@/components/Rates";

import { mapActions, mapState } from "vuex";

export default {
  name: "home",
  components: {
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
