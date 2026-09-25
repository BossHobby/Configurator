<script setup lang="ts">
import Button from "./Button.vue";
import Icon from "./Icon.vue";
withDefaults(
  defineProps<{
    dirty: boolean;
    needsReboot?: boolean;
    busy?: boolean;
    rebooting?: boolean;
    rebootDisabled?: boolean;
    error?: string;
    disabled?: boolean;
  }>(),
  { error: undefined },
);
defineEmits<{ apply: []; reboot: [] }>();
</script>
<template>
  <footer
    class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line bg-panel px-4 py-3"
  >
    <p
      role="status"
      class="flex items-center gap-2 text-xs"
      :class="
        error
          ? 'text-danger'
          : dirty || needsReboot
            ? 'text-warning'
            : 'text-muted'
      "
    >
      <Icon :name="error || dirty || needsReboot ? 'warning' : 'check'" />{{
        error ||
        (rebooting
          ? "Rebooting…"
          : busy
            ? "Applying changes…"
            : dirty
              ? "Unsaved changes"
              : needsReboot
                ? "Reboot required"
                : "All changes applied")
      }}
    </p>
    <div class="flex gap-2">
      <Button
        :disabled="busy || rebootDisabled"
        :busy="rebooting"
        @click="$emit('reboot')"
        >Reboot</Button
      ><Button
        variant="primary"
        :disabled="!dirty || disabled || rebooting"
        :busy="busy"
        @click="$emit('apply')"
        >Apply changes</Button
      >
    </div>
  </footer>
</template>
