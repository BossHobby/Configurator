<template>
  <Mission />
</template>
<script lang="ts">
import { defineComponent } from "vue";
import Mission from "@/panel/Mission.vue";

export default defineComponent({
  name: "MissionView",
  components: { Mission },
});
</script>
