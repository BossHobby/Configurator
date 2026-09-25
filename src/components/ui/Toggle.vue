<script setup lang="ts">
defineProps<{ modelValue: boolean; label: string; disabled?: boolean }>();
defineEmits<{ "update:modelValue": [value: boolean] }>();
</script>
<template>
  <label
    class="inline-flex min-h-9 cursor-pointer items-center gap-3 text-sm has-disabled:cursor-not-allowed has-disabled:opacity-50"
    ><input
      type="checkbox"
      role="switch"
      :checked="modelValue"
      :disabled="disabled"
      class="peer sr-only"
      @change="
        $emit('update:modelValue', ($event.target as HTMLInputElement).checked)
      "
    /><span
      aria-hidden="true"
      class="flex h-5 w-9 shrink-0 items-center rounded-full border border-line bg-subtle p-0.5 peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-accent"
      ><span
        class="size-3.5 rounded-full"
        :class="modelValue ? 'translate-x-4 bg-on-accent' : 'bg-muted'" /></span
    >{{ label }}</label
  >
</template>
