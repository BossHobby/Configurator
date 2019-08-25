<template>
  <b-row>
    <b-col sm="6">
      <Setup></Setup>
      <PIDRates class="my-3"></PIDRates>
    </b-col>
    <b-col sm="6">
      <Voltage></Voltage>
    </b-col>
  </b-row>
</template>

<script>
import Setup from "@/components/Setup";
import Voltage from "@/components/Voltage";
import PIDRates from "@/components/PIDRates";

import { mapActions, mapState } from "vuex";

export default {
  name: "home",
  components: {
    Setup,
    Voltage,
    PIDRates
  },
  computed: mapState(["profile"]),
  methods: {
    ...mapActions([])
  }
};
</script>
