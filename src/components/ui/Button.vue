<script setup lang="ts">
import Icon from "./Icon.vue";
withDefaults(
  defineProps<{
    variant?: "primary" | "secondary";
    disabled?: boolean;
    busy?: boolean;
    type?: "button" | "submit" | "reset";
  }>(),
  { variant: "secondary", type: "button" },
);
</script>
<template>
  <button
    :type="type"
    :disabled="disabled || busy"
    :aria-busy="busy || undefined"
    class="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
    :class="
      variant === 'primary'
        ? 'border-accent bg-accent text-on-accent enabled:hover:brightness-95'
        : 'border-line bg-panel text-ink enabled:hover:bg-subtle'
    "
  >
    <Icon v-if="busy" name="loading" class="motion-safe:animate-spin" /><slot />
  </button>
</template>
