<template>
  <div class="modal-portal">
    {{ $modal.isShown }}
    <div v-if="$modal.isShown" class="modal is-active">
      <div class="modal-background"></div>
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
