<template>
  <div class="space-y-4">
    <div class="grid items-stretch gap-4 lg:grid-cols-2">
      <GyroModel /><BoardOrientationSettings /><Voltage /><Serial />
    </div>
    <VTX v-if="profile.serial.smart_audio != 0 || profile.serial.hdzero != 0" />
    <GPS v-if="profile.profileVersionGt('0.2.6') && profile.serial.gps != 0" />
  </div>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import BoardOrientationSettings from "@/panel/BoardOrientationSettings.vue";
import Voltage from "@/panel/Voltage.vue";
import Serial from "@/panel/Serial.vue";
import GPS from "@/panel/GPS.vue";
import VTX from "@/panel/VTX.vue";
import GyroModel from "@/panel/GyroModel.vue";
import { useProfileStore } from "@/store/profile";

export default defineComponent({
  name: "Home",
  components: {
    BoardOrientationSettings,
    Voltage,
    Serial,
    GPS,
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
