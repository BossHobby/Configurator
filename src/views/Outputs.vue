<template>
  <div class="columns is-multiline">
    <div class="column is-12">
      <OutputMapping></OutputMapping>
    </div>
    <div class="column is-12">
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
