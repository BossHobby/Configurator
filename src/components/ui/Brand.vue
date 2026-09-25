<script setup lang="ts">
import Avocado from "../../assets/Logo_Clean.svg?component";
import Wordmark from "../../assets/Logo_Text.svg?component";
</script>
<template>
  <div class="flex items-center gap-2" aria-label="QUICKSILVER">
    <Avocado class="size-8 shrink-0" aria-hidden="true" /><Wordmark
      viewBox="0 0 512 82"
      class="ui-wordmark h-auto w-32"
      aria-hidden="true"
    />
  </div>
</template>
<style scoped>
.ui-wordmark :deep(path) {
  fill: currentColor !important;
}
</style>
