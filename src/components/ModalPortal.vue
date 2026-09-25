<template>
  <div class="modal-portal">
    <div
      v-if="$modal.isShown"
      class="fixed inset-0 z-[10000] flex items-center justify-center p-4"
    >
      <div class="absolute inset-0 bg-workspace/85"></div>
      <component
        :is="$modal.component"
        v-bind="$modal.props"
        @close="$modal.close($event)"
      ></component>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ModalPortal",
});
</script>

<style></style>
