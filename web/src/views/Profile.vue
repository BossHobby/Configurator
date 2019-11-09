<template>
  <b-row>
    <b-col sm="6">
      <Metadata></Metadata>
    </b-col>
    <b-col sm="6">
      <Voltage></Voltage>
    </b-col>
  </b-row>
</template>

<script>
import Metadata from "@/components/Metadata";
import Voltage from "@/components/Voltage";

import { mapActions, mapState } from "vuex";

export default {
  name: "home",
  components: {
    Metadata,
    Voltage
  },
  computed: mapState(["profile"]),
  methods: {
    ...mapActions([])
  }
};
</script>
