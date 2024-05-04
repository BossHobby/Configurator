<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Select {{ title }}</p>
      <button
        class="delete has-background-primary"
        aria-label="close"
        @click="$emit('close')"
      ></button>
    </header>
    <section class="modal-card-body">
      <div class="select is-fullwidth is-multiple select-list">
        <div class="control">
          <select v-model="value" size="8">
            <option v-for="o of options" :key="o.value" :value="o.value">
              {{ o.text }}
            </option>
          </select>
        </div>
      </div>
    </section>
    <footer class="modal-card-foot">
      <button class="button" @click="$emit('close')">Cancel</button>
      <button
        class="button is-success"
        :disabled="value == undefined"
        @click="$emit('close', value)"
      >
        Select
      </button>
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
