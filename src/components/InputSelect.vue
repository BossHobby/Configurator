<template>
  <div
    class="input-select relative min-w-0"
    :class="$attrs.class"
    :style="$attrs.style"
  >
    <select
      v-model="inputVal"
      v-bind="selectAttrs()"
      class="min-h-9 w-full min-w-0 appearance-none rounded-md border border-line bg-subtle py-2 pl-3 pr-10 text-sm text-ink disabled:opacity-50"
    >
      <option v-for="o of optionMap" :key="o.value" :value="o.value">
        {{ o.text }}
      </option>
    </select>
    <Icon
      name="chevron"
      class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
    />
  </div>
</template>

<script lang="ts">
import Icon from "./ui/Icon.vue";
import { defineComponent, type PropType } from "vue";

export default defineComponent({
  components: { Icon },
  inheritAttrs: false,
  props: {
    modelValue: { type: [String, Number, Boolean], default: undefined },
    options: {
      type: Array as PropType<
        Array<string | { text: string; value: string | number | boolean }>
      >,
      default: () => [],
    },
  },
  emits: ["update:modelValue"],
  computed: {
    inputVal: {
      get() {
        return this.modelValue;
      },
      set(val) {
        this.$emit("update:modelValue", val);
      },
    },
    optionMap() {
      return (this.options || []).map((o) => {
        if (typeof o === "string") {
          return {
            text: o,
            value: o,
          };
        }
        return o;
      });
    },
  },
  methods: {
    selectAttrs() {
      return Object.fromEntries(
        Object.entries(this.$attrs).filter(
          ([key]) => key !== "class" && key !== "style",
        ),
      );
    },
  },
});
</script>

<style></style>
