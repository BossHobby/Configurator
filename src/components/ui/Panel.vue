<script setup lang="ts">
import { inject, provide, useId } from "vue";
import Tooltip from "../Tooltip.vue";
defineProps<{ title: string; description?: string; help?: string }>();
const id = useId();
// A panel inside another panel renders as a divided sub-section instead of a
// second card, so nesting never stacks borders.
const nested = inject<boolean>("ui-panel", false);
provide("ui-panel", true);
</script>
<template>
  <section
    :aria-labelledby="id"
    class="min-w-0"
    :class="
      nested
        ? 'mt-6 border-t border-line pt-5'
        : 'rounded-lg border border-line bg-panel p-5'
    "
  >
    <header class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <component
          :is="nested ? 'h3' : 'h2'"
          :id="id"
          class="flex items-center gap-1.5 font-semibold"
          :class="nested ? 'text-sm' : 'text-base'"
          >{{ title }}<Tooltip v-if="help" :entry="help"
        /></component>
        <p v-if="description" class="mt-1 text-xs text-muted">
          {{ description }}
        </p>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </header>
    <slot />
  </section>
</template>
