<script setup lang="ts">
import { useId } from "vue";
defineProps<{ title: string; description?: string }>();
const id = useId();
</script>
<template>
  <section
    :aria-labelledby="id"
    class="min-w-0 rounded-lg border border-line bg-panel p-4"
  >
    <header class="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 :id="id" class="text-sm font-semibold">{{ title }}</h2>
        <p v-if="description" class="mt-1 text-xs text-muted">
          {{ description }}
        </p>
      </div>
      <slot name="actions" />
    </header>
    <slot />
  </section>
</template>
