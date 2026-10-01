<script setup lang="ts">
import { computed } from "vue";
import { channelPosition } from "../../ui/model";
const props = withDefaults(
  defineProps<{ label: string; value: number; min?: number; max?: number }>(),
  { min: -1, max: 1 },
);
const position = computed(() =>
  channelPosition(props.value, props.min, props.max),
);
</script>
<template>
  <div class="grid grid-cols-[4rem_1fr_3rem] items-center gap-3 text-xs">
    <span>{{ label }}</span>
    <div
      role="meter"
      :aria-label="label"
      :aria-valuenow="Math.min(max, Math.max(min, value))"
      :aria-valuemin="min"
      :aria-valuemax="max"
      class="relative h-3 rounded bg-line"
    >
      <span
        aria-hidden="true"
        class="absolute top-0 h-3 w-1 rounded bg-accent"
        :style="{ left: `clamp(0px, ${position}%, calc(100% - 4px))` }"
      />
    </div>
    <output class="text-right tabular-nums">{{ value.toFixed(2) }}</output>
  </div>
</template>
