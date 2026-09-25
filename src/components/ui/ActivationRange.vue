<script setup lang="ts">
import { computed } from "vue";
import { channelPosition } from "../../ui/model";
const props = defineProps<{
  modelValue: [number, number];
  label: string;
  disabled?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [value: [number, number]] }>();
const start = computed(() => channelPosition(props.modelValue[0], 0, 1));
const end = computed(() => channelPosition(props.modelValue[1], 0, 1));
function update(index: 0 | 1, event: Event) {
  const value = (event.target as HTMLInputElement).valueAsNumber;
  if (!Number.isFinite(value)) return;
  const next = [...props.modelValue] as [number, number];
  next[index] =
    Math.round(
      Math.max(
        index === 0 ? 0 : next[0],
        Math.min(index === 0 ? next[1] : 1, value),
      ) * 100,
    ) / 100;
  emit("update:modelValue", next);
}
</script>
<template>
  <div
    class="grid min-w-0 grid-cols-[minmax(100px,1fr)_4.5rem_4.5rem] items-center gap-3"
    :class="disabled ? 'opacity-50' : ''"
  >
    <div class="relative mx-2 h-10">
      <div class="absolute top-1/2 h-2 w-full -translate-y-1/2 rounded bg-line">
        <div
          class="absolute h-2 rounded bg-accent"
          :style="{ left: start + '%', width: end - start + '%' }"
        />
      </div>
      <input
        v-for="(value, index) in modelValue"
        :key="index"
        class="ui-range absolute inset-0 m-0 h-10 w-full"
        type="range"
        min="0"
        max="1"
        step="0.01"
        :value="value"
        :disabled="disabled"
        :aria-label="label + (index === 0 ? ' minimum' : ' maximum')"
        :aria-valuemin="index === 0 ? 0 : modelValue[0]"
        :aria-valuemax="index === 0 ? modelValue[1] : 1"
        @input="update(index as 0 | 1, $event)"
      />
    </div>
    <label v-for="(value, index) in modelValue" :key="index" class="min-w-0"
      ><span class="sr-only"
        >{{ label }} {{ index === 0 ? "minimum value" : "maximum value" }}</span
      ><input
        type="number"
        :min="index === 0 ? 0 : modelValue[0]"
        :max="index === 0 ? modelValue[1] : 1"
        step="0.01"
        :value="value.toFixed(2)"
        :disabled="disabled"
        class="min-h-9 w-full rounded-md border border-line bg-subtle px-2 py-2 text-xs tabular-nums"
        @change="update(index as 0 | 1, $event)"
    /></label>
  </div>
</template>
<style scoped>
.ui-range {
  appearance: none;
  background: transparent;
  pointer-events: none;
}
.ui-range::-webkit-slider-thumb {
  appearance: none;
  pointer-events: auto;
  width: 16px;
  height: 16px;
  border: 3px solid var(--ui-accent);
  border-radius: 50%;
  background: var(--ui-panel);
  cursor: ew-resize;
}
.ui-range::-moz-range-thumb {
  pointer-events: auto;
  width: 10px;
  height: 10px;
  border: 3px solid var(--ui-accent);
  border-radius: 50%;
  background: var(--ui-panel);
  cursor: ew-resize;
}
.ui-range:disabled::-webkit-slider-thumb {
  pointer-events: none;
}
.ui-range:disabled::-moz-range-thumb {
  pointer-events: none;
}
.ui-range:focus-visible {
  outline: none;
}
.ui-range:focus-visible::-webkit-slider-thumb {
  outline: 2px solid var(--ui-ink);
  outline-offset: 3px;
}
.ui-range:focus-visible::-moz-range-thumb {
  outline: 2px solid var(--ui-ink);
  outline-offset: 3px;
}
@media (pointer: coarse) {
  .ui-range::-webkit-slider-thumb {
    width: 24px;
    height: 24px;
  }
  .ui-range::-moz-range-thumb {
    width: 18px;
    height: 18px;
  }
}
</style>
