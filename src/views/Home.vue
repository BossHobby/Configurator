<template>
  <Info></Info>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Info from "@/panel/Info.vue";

export default defineComponent({
  name: "Home",
  components: {
    Info,
  },
  methods: {},
});
</script>
