<template>
  <div
    class="fixed top-20 right-3 z-[10001] w-[min(28rem,calc(100vw-1.5rem))]"
    aria-live="polite"
  >
    <TransitionGroup name="alert" tag="div" class="flex flex-col gap-2">
      <div
        v-for="alert of root.alerts"
        :key="alert.id"
        :role="alert.type === 'danger' ? 'alert' : 'status'"
        class="relative flex items-start gap-3 rounded-lg border border-line border-l-4 bg-panel p-4 pr-10 text-sm text-ink shadow-lg"
        :class="
          alert.type === 'danger'
            ? 'border-l-danger'
            : alert.type === 'warning'
              ? 'border-l-warning'
              : 'border-l-accent'
        "
      >
        <Icon
          :name="
            alert.type === 'danger' || alert.type === 'warning'
              ? 'warning'
              : 'check'
          "
          :class="
            alert.type === 'danger'
              ? 'text-danger'
              : alert.type === 'warning'
                ? 'text-warning'
                : 'text-accent'
          "
        />
        <span class="min-w-0 break-words">{{ alert.msg }}</span>
        <button
          class="form-dismiss absolute top-2 right-2"
          aria-label="Dismiss notification"
          @click="dismiss(alert.id)"
        ></button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script lang="ts">
import Icon from "@/components/ui/Icon.vue";
import { useRootStore } from "@/store/root";
import { defineComponent } from "vue";

export default defineComponent({
  name: "AlertPortal",
  components: { Icon },
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

<style>
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
