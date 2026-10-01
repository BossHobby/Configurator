<template>
  <div
    role="alertdialog"
    aria-modal="true"
    :aria-labelledby="id + '-title'"
    :aria-describedby="id + '-message'"
    class="relative z-10 w-full max-w-md rounded-lg border border-line bg-panel p-5 text-ink shadow-xl"
  >
    <h2 :id="id + '-title'" class="text-base font-semibold">{{ title }}</h2>
    <p :id="id + '-message'" class="mt-2 text-sm text-muted">{{ message }}</p>
    <div class="mt-5 flex flex-wrap justify-end gap-2">
      <UiButton @click="$emit('close')">Cancel</UiButton>
      <UiButton
        v-for="action in actions"
        :key="action.value"
        :variant="action.variant || 'secondary'"
        @click="$emit('close', action.value)"
        >{{ action.label }}</UiButton
      >
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import UiButton from "./ui/Button.vue";

export interface ConfirmAction {
  label: string;
  value: string;
  variant?: "primary" | "secondary";
}

let nextId = 0;

export default defineComponent({
  name: "ConfirmModal",
  components: { UiButton },
  props: {
    title: { type: String, required: true },
    message: { type: String, required: true },
    actions: { type: Array as PropType<ConfirmAction[]>, required: true },
  },
  emits: ["close"],
  data() {
    return { id: `confirm-${nextId++}` };
  },
  mounted() {
    (this.$el as HTMLElement)
      .querySelector<HTMLButtonElement>("button:last-of-type")
      ?.focus();
  },
});
</script>
