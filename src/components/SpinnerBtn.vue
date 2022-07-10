<template>
  <button
    class="button"
    :class="{ 'is-loading': loading }"
    @click="clickHandler"
    v-bind="$attrs"
  >
    <slot></slot>
  </button>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      loading: false,
    };
  },
  methods: {
    clickHandler(event) {
      const click = this.$attrs.onClick as any;

      this.loading = true;
      Promise.resolve()
        .then(() => click(event))
        .finally(() => (this.loading = false));
    },
  },
});
</script>

<style></style>
