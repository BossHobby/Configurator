<template>
  <b-row>
    <b-col sm="6">
      <Metadata class="control-card"></Metadata>
    </b-col>
    <b-col sm="6">
      <Voltage class="control-card"></Voltage>
    </b-col>
    <b-col sm="6" class="my-4">
      <Serial class="control-card"></Serial>
    </b-col>
    <b-col sm="6" class="my-4">
      <VTX class="control-card" v-if="serial.smart_audio != 0"></VTX>
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
