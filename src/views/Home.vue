<template>
  <div class="columns is-multiline">
    <div class="column is-12">
      <Info></Info>
    </div>
    <div class="column is-12">
      <Flash></Flash>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Info from "@/panel/Info.vue";
import Flash from "@/panel/Flash.vue";

export default defineComponent({
  name: "Home",
  components: {
    Info,
    Flash,
  },
});
</script>
