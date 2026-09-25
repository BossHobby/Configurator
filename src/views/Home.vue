<template>
  <div class="space-y-4"><Info /><Flash /></div>
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
