<template>
  <button class="button" @click="clickHandler" v-bind="$attrs">
    <span v-if="loading" class="icon">
      <i class="fas fa-spinner fa-pulse"></i>
    </span>
    <slot v-else></slot>
  </button>
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
