<template>
  <div class="columns is-multiline">
    <div class="column is-12">
      <OutputMapping></OutputMapping>
    </div>
    <div class="column is-12">
      <MotorOutputSettings></MotorOutputSettings>
    </div>
    <div class="column is-12">
      <MotorTest></MotorTest>
    </div>
    <div
      v-if="!info.is_rover && info.has_feature(constants.Features.BRUSHLESS)"
      class="column is-12"
    >
      <ESCSettings></ESCSettings>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ESCSettings from "@/panel/ESCSettings.vue";
import MotorOutputSettings from "@/panel/MotorOutputSettings.vue";
import MotorTest from "@/panel/MotorTest.vue";
import OutputMapping from "@/panel/OutputMapping.vue";
import { useConstantStore } from "@/store/constants";
import { useInfoStore } from "@/store/info";

export default defineComponent({
  name: "Outputs",
  components: { ESCSettings, MotorOutputSettings, MotorTest, OutputMapping },
  setup() {
    return {
      constants: useConstantStore(),
      info: useInfoStore(),
    };
  },
});
</script>
