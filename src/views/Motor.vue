<template>
  <div class="columns is-multiline">
    <div class="column is-12">
      <MotorTest></MotorTest>
    </div>
    <div class="column is-12">
      <MotorPins></MotorPins>
    </div>
    <div
      v-if="info.has_feature(constants.Features.BRUSHLESS)"
      class="column is-12"
    >
      <ESCSettings></ESCSettings>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import MotorTest from "../panel/MotorTest.vue";
import MotorPins from "../panel/MotorPins.vue";
import ESCSettings from "../panel/ESCSettings.vue";
import { useInfoStore } from "@/store/info";
import { useConstantStore } from "@/store/constants";

export default defineComponent({
  name: "Motor",
  components: { MotorTest, MotorPins, ESCSettings },
  setup() {
    return {
      info: useInfoStore(),
      constants: useConstantStore(),
    };
  },
});
</script>
