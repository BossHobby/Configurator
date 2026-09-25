<script setup lang="ts">
import { useId } from "vue";
import type { Appearance } from "../../ui/model";
defineProps<{ modelValue: Appearance }>();
defineEmits<{ "update:modelValue": [value: Appearance] }>();
const name = useId();
const options: Appearance[] = ["system", "light", "dark"];
</script>
<template>
  <fieldset class="m-0 w-full min-w-0 border-0 p-0">
    <legend class="mb-2 p-0 text-xs text-muted">Appearance</legend>
    <div
      class="m-0 grid grid-cols-3 gap-0.5 rounded-md border border-line bg-subtle p-0.5"
    >
      <label
        v-for="option in options"
        :key="option"
        class="m-0 min-w-0 cursor-pointer"
        ><input
          class="peer sr-only"
          type="radio"
          :name="name"
          :value="option"
          :checked="modelValue === option"
          @change="$emit('update:modelValue', option)"
        /><span
          class="flex min-h-9 items-center justify-center rounded px-1 text-xs leading-none capitalize text-muted peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
          >{{ option }}</span
        ></label
      >
    </div>
  </fieldset>
</template>
