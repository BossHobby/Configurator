<template>
  <b-row>
    <b-col sm="6">
      <Setup></Setup>
    </b-col>
    <b-col sm="6">
      <PIDRates></PIDRates>
    </b-col>
  </b-row>
</template>

<script>
import Setup from "@/components/Setup";
import PIDRates from "@/components/PIDRates";

import { mapActions, mapState } from "vuex";

export default {
  name: "home",
  components: {
    Setup,
    PIDRates
  },
  computed: mapState(["profile"]),
  methods: {
    ...mapActions([])
  }
};
</script>
