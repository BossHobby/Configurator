<script setup lang="ts">
import { useAttrs, useId } from "vue";
import Icon from "./Icon.vue";
defineOptions({ inheritAttrs: false });
defineProps<{
  modelValue: string | number;
  label: string;
  options: { label: string; value: string | number }[];
  disabled?: boolean;
  hideLabel?: boolean;
}>();
defineEmits<{ "update:modelValue": [value: string | number] }>();
const id = useId();
const attrs = useAttrs();
function selectAttrs() {
  return Object.fromEntries(
    Object.entries(attrs).filter(([key]) => key !== "class" && key !== "style"),
  );
}
</script>
<template>
  <div class="min-w-0" :class="$attrs.class" :style="$attrs.style">
    <label
      :for="id"
      :class="hideLabel ? 'sr-only' : 'mb-1.5 block text-xs text-muted'"
      >{{ label }}</label
    >
    <div class="relative">
      <select
        :id="id"
        v-bind="selectAttrs()"
        :value="modelValue"
        :disabled="disabled"
        class="min-h-9 w-full min-w-0 rounded-md border border-line bg-subtle appearance-none pl-3 pr-10 py-2 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-50"
        @change="
          $emit(
            'update:modelValue',
            options[($event.target as HTMLSelectElement).selectedIndex].value,
          )
        "
      >
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option></select
      ><Icon
        name="chevron"
        class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        :class="disabled ? 'opacity-50' : ''"
      />
    </div>
  </div>
</template>
