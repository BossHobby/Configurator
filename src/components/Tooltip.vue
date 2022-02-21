<template>
  <span v-if="visible">
    <b-icon
      icon="question-circle-fill"
      :variant="!danger ? 'secondary' : 'danger'"
      :id="'tooltip-' + entry"
      class="tooltip-icon"
    ></b-icon>
    <b-tooltip :target="'tooltip-' + entry" triggers="click hover">
      <span v-if="!danger">
        {{ tooltip.text }}
        <div v-if="tooltip.link">
          <a target="_blank" :href="tooltip.link">read more</a>
        </div>
      </span>
      <span v-else> Missing tooltip entry {{ entry }} </span>
    </b-tooltip>
  </span>
</template>

<script>
import tooltipEntries from "@/assets/tooltips.json";

export default {
  props: ["entry"],
  data() {
    return {};
  },
  computed: {
    tooltip() {
      return tooltipEntries[this.entry];
    },
    danger() {
      return !this.tooltip || !this.tooltip.text;
    },
    visible() {
      return this.entry && (!this.tooltip || !this.tooltip.disabled);
    },
  },
  methods: {},
  created() {},
};
</script>

<style>
.tooltip-icon {
  cursor: pointer;
}
</style>
