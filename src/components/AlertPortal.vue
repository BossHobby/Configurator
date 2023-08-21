<template>
  <div class="alert-portal">
    <TransitionGroup name="alert" tag="div">
      <div
        v-for="alert of root.alerts"
        :key="alert.id"
        class="notification"
        :class="['is-' + alert.type]"
      >
        <button class="delete" @click="dismiss(alert.id)"></button>
        {{ alert.msg }}
      </div>
    </TransitionGroup>
  </div>
</template>

<script lang="ts">
import { useRootStore } from "@/store/root";
import { defineComponent } from "vue";

export default defineComponent({
  name: "AlterPortal",
  setup() {
    return {
      root: useRootStore(),
    };
  },
  data() {
    return {
      timeouts: {},
    };
  },
  watch: {
    "root.alerts"(current: any[], previous: any[]) {
      if (current.length <= previous.length) {
        return;
      }

      const id = current[current.length - 1].id;
      this.timeouts[id] = window.setTimeout(() => {
        this.root.pop_alert(id);
        delete this.timeouts[id];
      }, 2500);
    },
  },
  methods: {
    dismiss(id) {
      clearTimeout(this.timeouts[id]);
      this.root.pop_alert(id);
      delete this.timeouts[id];
    },
  },
});
</script>

<style lang="scss">
.alert-portal {
  position: fixed;
  right: 10px;
  top: 85px;
  z-index: 10001;
  width: 500px;
}
@media screen and (max-width: 1023px) {
  .alert-portal {
    position: fixed;
    left: calc( 50vw - 200px );
    top: 85px;
    z-index: 10001;
    width: 400px;
  }
}
.alert-enter-active,
.alert-leave-active {
  transition: all 0.5s ease;
}
.alert-enter-from,
.alert-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
