<template>
  <div class="columns is-multiline">
    <div class="column is-12">
      <GyroModel></GyroModel>
    </div>
    <div class="column is-12">
      <Motor></Motor>
    </div>
  </div>
  <div class="columns">
    <div class="column is-6">
      <Voltage></Voltage>
    </div>
    <div class="column is-6">
      <Serial></Serial>
    </div>
  </div>
  <div class="columns">
    <div class="column is-12">
      <VTX
        v-if="profile.serial.smart_audio != 0 || profile.serial.hdzero != 0"
      ></VTX>
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
import { useProfileStore } from "@/store/profile";

export default defineComponent({
  name: "home",
  components: {
    Motor,
    Voltage,
    Serial,
    VTX,
    GyroModel,
  },
  setup() {
    return {
      profile: useProfileStore(),
    };
  },
});
</script>
