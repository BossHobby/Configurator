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
    class="form-button"
    :class="variant === 'primary' ? 'form-button-primary' : ''"
  >
    <Icon v-if="busy" name="loading" class="motion-safe:animate-spin" /><slot />
  </button>
</template>
