<template>
  <form
    role="dialog"
    aria-modal="true"
    :aria-labelledby="id + '-title'"
    class="relative z-10 w-full max-w-sm rounded-lg border border-line bg-panel p-5 text-ink shadow-xl"
    @submit.prevent="submit"
  >
    <h2 :id="id + '-title'" class="text-base font-semibold">{{ title }}</h2>
    <p class="mt-2 text-sm text-muted">
      Meters above launch, starting from the altitude the craft holds now.
    </p>
    <label class="mt-4 form-row">
      <span class="form-label">Altitude (m)</span>
      <input
        ref="input"
        v-model.number="value"
        class="form-input"
        type="number"
        step="1"
        :min="min"
        :max="max"
        required
      />
    </label>
    <div class="mt-5 flex flex-wrap justify-end gap-2">
      <UiButton @click="$emit('close')">Cancel</UiButton>
      <UiButton type="submit" variant="primary" :disabled="!valid">{{
        action
      }}</UiButton>
    </div>
  </form>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import UiButton from "@/components/ui/Button.vue";

let nextId = 0;

export default defineComponent({
  name: "AltitudeModal",
  components: { UiButton },
  props: {
    title: { type: String, required: true },
    action: { type: String, required: true },
    altitude: { type: Number, required: true },
    min: { type: Number, required: true },
    max: { type: Number, required: true },
  },
  emits: ["close"],
  data() {
    return { id: `altitude-${nextId++}`, value: this.altitude };
  },
  computed: {
    valid(): boolean {
      return (
        Number.isFinite(this.value) &&
        this.value >= this.min &&
        this.value <= this.max
      );
    },
  },
  mounted() {
    const input = this.$refs.input as HTMLInputElement;
    input.focus();
    input.select();
  },
  methods: {
    submit() {
      if (this.valid) this.$emit("close", this.value);
    },
  },
});
</script>
