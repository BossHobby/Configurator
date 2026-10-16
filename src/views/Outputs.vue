<template>
  <div class="space-y-4">
    <div>
      <OutputMapping></OutputMapping>
    </div>
    <!-- Spinning motors stays on USB. -->
    <div v-if="!serial.radio_link">
      <MotorTest></MotorTest>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import MotorTest from "@/panel/MotorTest.vue";
import OutputMapping from "@/panel/OutputMapping.vue";
import { useSerialStore } from "@/store/serial";

export default defineComponent({
  name: "Outputs",
  components: { MotorTest, OutputMapping },
  setup() {
    return { serial: useSerialStore() };
  },
});
</script>
