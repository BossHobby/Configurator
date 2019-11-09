<template>
  <b-row>
    <b-col sm="12">
      <GyroModel class="my-2"></GyroModel>
    </b-col>
    <b-col sm="12">
      <Motor class="my-2"></Motor>
    </b-col>
    <b-col sm="12">
      <PIDRates class="my-2"></PIDRates>
    </b-col>
  </b-row>
</template>

<script>
import Motor from "@/components/Motor";
import PIDRates from "@/components/PIDRates";
import GyroModel from "@/components/GyroModel";

import { mapActions, mapState } from "vuex";

export default {
  name: "home",
  components: {
    Motor,
    PIDRates,
    GyroModel
  },
  computed: mapState(["profile"]),
  methods: {
    ...mapActions([])
  }
};
</script>
