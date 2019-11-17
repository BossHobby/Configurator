<template>
  <b-row>
    <b-col sm="6">
      <Metadata></Metadata>
    </b-col>
    <b-col sm="6">
      <Voltage></Voltage>
    </b-col>
    <b-col offset="6" sm="6" class="my-2">
      <Serial></Serial>
    </b-col>
  </b-row>
</template>

<script>
import Metadata from "@/components/Metadata";
import Voltage from "@/components/Voltage";
import Serial from "@/components/Serial";

import { mapActions, mapState } from "vuex";

export default {
  name: "home",
  components: {
    Metadata,
    Voltage,
    Serial
  },
  computed: mapState(["profile"]),
  methods: {
    ...mapActions([])
  }
};
</script>
