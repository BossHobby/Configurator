<template>
  <b-row>
    <b-col sm="6">
      <Motor></Motor>
      <PIDRates class="my-3"></PIDRates>
    </b-col>
    <b-col sm="6">
      <Voltage></Voltage>
    </b-col>
  </b-row>
</template>

<script>
import Motor from "@/components/Motor";
import Voltage from "@/components/Voltage";
import PIDRates from "@/components/PIDRates";

import { mapActions, mapState } from "vuex";

export default {
  name: "home",
  components: {
    Motor,
    Voltage,
    PIDRates
  },
  computed: mapState(["profile"]),
  methods: {
    ...mapActions([])
  }
};
</script>
