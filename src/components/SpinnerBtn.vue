<template>
  <button
    class="form-button"
    :aria-busy="loading"
    v-bind="filteredAttrs"
    :disabled="
      loading || ($attrs.disabled !== undefined && $attrs.disabled !== false)
    "
    @click="clickHandler"
  >
    <span
      v-if="loading"
      aria-hidden="true"
      class="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
    <slot></slot>
  </button>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  inheritAttrs: false,
  data() {
    return {
      loading: false,
    };
  },
  computed: {
    filteredAttrs() {
      const onRE = /^on[^a-z]/;
      const attributes = {};
      const { $attrs } = this;

      for (const property in $attrs) {
        if (!onRE.test(property)) {
          attributes[property] = $attrs[property];
        }
      }
      return attributes;
    },
  },
  methods: {
    clickHandler(event) {
      const click = this.$attrs.onClick as any;

      this.loading = true;
      Promise.resolve()
        .then(() => (click ? click(event) : null))
        .finally(() => (this.loading = false));
    },
  },
});
</script>

<style></style>
