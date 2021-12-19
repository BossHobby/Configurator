<template>
  <b-button @click="clickHandler" v-bind="$attrs">
    <b-spinner v-if="loading" small></b-spinner>
    <slot v-else></slot>
  </b-button>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
    };
  },
  methods: {
    clickHandler(event) {
      const click = this.$listeners.click;

      this.loading = true;
      Promise.resolve()
        .then(() => click(event))
        .finally(() => (this.loading = false));
    },
  },
  created() {},
};
</script>

<style></style>
