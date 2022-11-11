<template>
  <button
    class="button"
    :class="{ 'is-loading': loading }"
    v-bind="filteredAttrs"
    @click="clickHandler"
  >
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
