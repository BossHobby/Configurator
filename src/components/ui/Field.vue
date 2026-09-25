<script setup lang="ts">
import { useId } from "vue";
defineOptions({ inheritAttrs: false });
withDefaults(
  defineProps<{
    modelValue: string | number | null;
    label: string;
    type?: "text" | "number";
    unit?: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
  }>(),
  { type: "text", unit: undefined, hint: undefined, error: undefined },
);
const emit = defineEmits<{
  "update:modelValue": [value: string | number | null];
}>();
const id = useId();
function update(event: Event) {
  const input = event.target as HTMLInputElement;
  emit(
    "update:modelValue",
    input.type === "number"
      ? Number.isFinite(input.valueAsNumber)
        ? input.valueAsNumber
        : null
      : input.value,
  );
}
</script>
<template>
  <div class="min-w-0">
    <label :for="id" class="mb-1.5 block text-xs text-muted"
      >{{ label }}<span v-if="unit"> · {{ unit }}</span></label
    ><input
      :id="id"
      v-bind="$attrs"
      :value="modelValue ?? ''"
      :type="type"
      :disabled="disabled"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="error || hint ? id + '-hint' : undefined"
      class="min-h-9 w-full min-w-0 rounded-md border bg-subtle px-3 py-2 text-sm text-ink tabular-nums disabled:cursor-not-allowed disabled:opacity-50"
      :class="error ? 'border-danger' : 'border-line'"
      @input="update"
    />
    <p
      v-if="error || hint"
      :id="id + '-hint'"
      class="mt-1.5 text-xs"
      :class="error ? 'text-danger' : 'text-muted'"
    >
      {{ error || hint }}
    </p>
  </div>
</template>
