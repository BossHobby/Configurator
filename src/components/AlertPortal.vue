<template>
  <div class="alert-portal">
    <div
      v-for="(alert, index) in alerts"
      :key="index"
      class="notification"
      :class="['is-' + alert.type]"
    >
      <button class="delete"></button>
      {{ alert.msg }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapState } from "vuex";

export default defineComponent({
  computed: {
    ...mapState(["alerts"]),
  },
});
</script>

<style lang="scss">
.alert-portal {
  position: fixed;
  right: 5px;
  top: 85px;
  z-index: 10001;
  width: 500px;
}
</style>
