<template>
  <UiButton
    v-bind="filteredAttrs"
    :variant="variant"
    :type="type"
    :busy="loading"
    :disabled="disabled"
    @click="clickHandler"
  >
    <slot></slot>
  </UiButton>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import UiButton from "./ui/Button.vue";

/** A Button that shows a busy state until its (async) click handler settles. */
export default defineComponent({
  components: { UiButton },
  inheritAttrs: false,
  props: {
    variant: {
      type: String as PropType<"primary" | "secondary">,
      default: "secondary",
    },
    type: {
      type: String as PropType<"button" | "submit" | "reset">,
      default: "button",
    },
    disabled: { type: Boolean, default: false },
  },
  data() {
    return {
      loading: false,
    };
  },
  computed: {
    filteredAttrs() {
      const onRE = /^on[^a-z]/;
      const attributes = {};
      for (const property in this.$attrs) {
        if (!onRE.test(property)) {
          attributes[property] = this.$attrs[property];
        }
      }
      return attributes;
    },
  },
  methods: {
    clickHandler(event) {
      const click = this.$attrs.onClick as any;
      if (!click) return;
      this.loading = true;
      Promise.resolve()
        .then(() => click(event))
        .finally(() => (this.loading = false));
    },
  },
});
</script>
