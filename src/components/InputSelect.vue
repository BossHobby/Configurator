<template>
  <div class="select" v-bind="$attrs">
    <select v-model="inputVal">
      <option v-for="o of optionMap" :key="o.value" :value="o.value">
        {{ o.text }}
      </option>
    </select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: ["modelValue", "options"],
  emits: ["update:modelValue"],
  computed: {
    inputVal: {
      get() {
        return this.modelValue;
      },
      set(val) {
        this.$emit("update:modelValue", val);
      },
    },
    optionMap() {
      return (this.options || []).map((o) => {
        if (typeof o === "string") {
          return {
            text: o,
            value: o,
          };
        }
        return o;
      });
    },
  },
});
</script>

<style></style>
