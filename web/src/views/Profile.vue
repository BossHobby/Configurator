<template>
  <b-row>
    <b-col sm="6">
      <Metadata></Metadata>
    </b-col>
    <b-col sm="6">
      <Voltage></Voltage>
    </b-col>
    <b-col sm="6" class="my-2">
      <VTX v-if="serial.smart_audio != 0"></VTX>
    </b-col>
    <b-col sm="6" class="my-2">
      <Serial></Serial>
    </b-col>
  </b-row>
</template>

<script>
import Metadata from "@/components/Metadata";
import Voltage from "@/components/Voltage";
import Serial from "@/components/Serial";
import VTX from "@/components/VTX";

import { mapState } from "vuex";

export default {
  name: "home",
  components: {
    Metadata,
    Voltage,
    Serial,
    VTX
  },
  computed: mapState({
    serial: state => state.profile.serial
  })
};
</script>
