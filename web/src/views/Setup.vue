<template>
  <b-row>
    <b-col sm="6">
      <Metadata></Metadata>
      <PIDRates class="my-3"></PIDRates>
    </b-col>
    <b-col sm="6">
      <Motor></Motor>
      <Voltage class="my-3"></Voltage>
    </b-col>
  </b-row>
</template>

<script>
import Metadata from "@/components/Metadata";
import Motor from "@/components/Motor";
import Voltage from "@/components/Voltage";
import PIDRates from "@/components/PIDRates";

import { mapActions, mapState } from "vuex";

export default {
  name: "home",
  components: {
    Metadata,
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
