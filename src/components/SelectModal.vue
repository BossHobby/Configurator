<template>
  <div
    class="relative z-10 flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-line bg-panel text-ink shadow-xl"
  >
    <header
      class="flex items-center justify-between gap-4 border-b border-line p-4"
    >
      <p class="text-lg font-semibold">Select {{ title }}</p>
      <button
        class="form-dismiss"
        aria-label="close"
        @click="$emit('close')"
      ></button>
    </header>
    <section class="min-h-0 overflow-y-auto p-4">
      <div class="min-w-0 w-full select-list">
        <div class="min-w-0">
          <select class="form-input" v-model="value" size="8">
            <option v-for="o of options" :key="o.value" :value="o.value">
              {{ o.text }}
            </option>
          </select>
        </div>
      </div>
    </section>
    <footer class="border-t border-line p-4">
      <div
        class="flex flex-wrap items-center gap-2 justify-between"
        style="width: 100%"
      >
        <button class="form-button" @click="$emit('close')">Cancel</button>
        <button
          class="form-button text-accent"
          :disabled="value == undefined"
          @click="$emit('close', value)"
        >
          Select
        </button>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "SelectModal",
  props: ["options", "title"],
  data() {
    return {
      value: undefined,
    };
  },
});
</script>

<style lang="scss">
.select-list {
  select {
    height: auto !important;
    padding: 0 !important;

    option {
      padding: 0.5em 1em !important;
    }
  }
}
</style>
