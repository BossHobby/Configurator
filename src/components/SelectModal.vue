<template>
  <div
    role="dialog"
    aria-modal="true"
    :aria-label="'Select ' + title"
    class="relative z-10 flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-line bg-panel text-ink shadow-xl"
  >
    <header class="flex items-center justify-between gap-4 p-5 pb-3">
      <h2 class="text-base font-semibold">Select {{ title }}</h2>
      <button
        class="form-dismiss"
        aria-label="Close"
        @click="$emit('close')"
      ></button>
    </header>
    <section class="min-h-0 overflow-y-auto px-5">
      <select
        v-model="value"
        class="form-input h-auto p-0 [&>option]:px-4 [&>option]:py-2"
        size="8"
        :aria-label="title"
        @dblclick="value != undefined && $emit('close', value)"
      >
        <option v-for="o of options" :key="o.value" :value="o.value">
          {{ o.text }}
        </option>
      </select>
    </section>
    <footer class="flex justify-end gap-2 p-5 pt-4">
      <UiButton @click="$emit('close')">Cancel</UiButton>
      <UiButton
        variant="primary"
        :disabled="value == undefined"
        @click="$emit('close', value)"
        >Select</UiButton
      >
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import UiButton from "./ui/Button.vue";

export default defineComponent({
  name: "SelectModal",
  components: { UiButton },
  props: {
    options: {
      type: Array as PropType<{ text: string; value: unknown }[]>,
      required: true,
    },
    title: { type: String, required: true },
  },
  emits: ["close"],
  data() {
    return {
      value: undefined,
    };
  },
});
</script>
