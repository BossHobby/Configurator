<template>
  <div class="columns is-multiline">
    <div class="column is-12 my-4">
      <GyroModel class="control-card"></GyroModel>
    </div>
    <div class="column is-12">
      <Motor class="control-card"></Motor>
    </div>
  </div>
  <div class="columns my-4">
    <div class="column is-6">
      <Voltage class="control-card"></Voltage>
    </div>
    <div class="column is-6">
      <Serial class="control-card"></Serial>
    </div>
  </div>
  <div class="columns my-4">
    <div class="column is-6">
      <VTX class="control-card" v-if="profile.serial.smart_audio != 0"></VTX>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Motor from "@/panel/Motor.vue";
import Voltage from "@/panel/Voltage.vue";
import Serial from "@/panel/Serial.vue";
import VTX from "@/panel/VTX.vue";
import GyroModel from "@/panel/GyroModel.vue";

import { mapActions, mapState } from "vuex";

export default defineComponent({
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
});
</script>
