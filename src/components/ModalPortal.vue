<template>
  <div
    v-if="$modal.isShown"
    class="fixed inset-0 z-[10000] flex items-center justify-center p-4"
    @keydown.esc="$modal.close(undefined)"
  >
    <div
      class="absolute inset-0 bg-workspace/85"
      @click="$modal.close(undefined)"
    ></div>
    <component
      :is="$modal.component"
      v-bind="$modal.props"
      @close="$modal.close($event)"
    ></component>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ModalPortal",
});
</script>
