<template>
  <b-container>
    <b-row>
      <b-col sm="12" class="my-4">
        <GyroModel class="control-card"></GyroModel>
      </b-col>
      <b-col sm="12">
        <Motor class="control-card"></Motor>
      </b-col>
    </b-row>
    <b-row class="my-4">
      <b-col sm="6">
        <Voltage class="control-card"></Voltage>
      </b-col>
      <b-col sm="6">
        <Serial class="control-card"></Serial>
      </b-col>
    </b-row>
    <b-row class="my-4">
      <b-col sm="6">
        <VTX class="control-card" v-if="profile.serial.smart_audio != 0"></VTX>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import Motor from "@/components/Motor.vue";
import Voltage from "@/components/Voltage.vue";
import Serial from "@/components/Serial.vue";
import VTX from "@/components/VTX.vue";
import GyroModel from "@/components/GyroModel.vue";

import { mapActions, mapState } from "vuex";

export default {
  name: "home",
  components: {
    Motor,
    Voltage,
    Serial,
    VTX,
    GyroModel,
  },
  computed: mapState(["profile"]),
  methods: {
    ...mapActions([]),
  },
};
</script>
