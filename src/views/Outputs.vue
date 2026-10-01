<template>
  <div class="space-y-4">
    <div>
      <OutputMapping></OutputMapping>
    </div>
    <div>
      <MotorTest></MotorTest>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import MotorTest from "@/panel/MotorTest.vue";
import OutputMapping from "@/panel/OutputMapping.vue";

export default defineComponent({
  name: "Outputs",
  components: { MotorTest, OutputMapping },
});
</script>
