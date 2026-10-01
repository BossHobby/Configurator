<script setup lang="ts">
import { computed, useAttrs, useId } from "vue";
import Icon from "./Icon.vue";
import Tooltip from "../Tooltip.vue";

type Value = string | number | boolean;
type Option =
  | string
  | { label: string; value: Value }
  | { text: string; value: Value };

defineOptions({ inheritAttrs: false });
const props = defineProps<{
  modelValue?: Value;
  options: Option[];
  /** Visible label; omit when the caller renders its own <label for>. */
  label?: string;
  disabled?: boolean;
  hideLabel?: boolean;
  /** Tooltip entry from assets/tooltips.json. */
  help?: string;
}>();
const emit = defineEmits<{ "update:modelValue": [value: Value] }>();

const attrs = useAttrs();
const generatedId = useId();
// A caller-supplied id wins so an external <label for> keeps working.
const id = computed(() => (attrs.id as string | undefined) ?? generatedId);
const selectAttrs = computed(() =>
  Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) => key !== "class" && key !== "style" && key !== "id",
    ),
  ),
);
const normalized = computed(() =>
  props.options.map((o) =>
    typeof o === "string"
      ? { label: o, value: o }
      : { label: "label" in o ? o.label : o.text, value: o.value },
  ),
);
function onChange(event: Event) {
  const index = (event.target as HTMLSelectElement).selectedIndex;
  emit("update:modelValue", normalized.value[index].value);
}
</script>
<template>
  <div class="min-w-0" :class="$attrs.class" :style="$attrs.style">
    <template v-if="label">
      <label v-if="hideLabel" :for="id" class="sr-only">{{ label }}</label>
      <div v-else class="form-label mb-1.5">
        <label :for="id">{{ label }}</label
        ><Tooltip v-if="help" :entry="help" />
      </div>
    </template>
    <div class="relative">
      <select
        :id="id"
        v-bind="selectAttrs"
        :value="modelValue"
        :disabled="disabled"
        class="form-select"
        @change="onChange"
      >
        <option
          v-for="option in normalized"
          :key="String(option.value)"
          :value="option.value"
        >
          {{ option.label }}
        </option></select
      ><Icon
        name="chevron"
        class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted"
        :class="disabled ? 'opacity-50' : ''"
      />
    </div>
  </div>
</template>
