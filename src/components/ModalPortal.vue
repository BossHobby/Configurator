<template>
  <div class="modal-portal">
    {{ $modal.isShown }}
    <div class="modal is-active" v-if="$modal.isShown">
      <div class="modal-background"></div>
      <component
        :is="$modal.component"
        v-bind="$modal.props"
        @close="$modal.close()"
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
