<template>
  <div class="alert-portal">
    <TransitionGroup name="alert" tag="div">
      <div
        v-for="alert of alerts"
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
import { defineComponent } from "vue";
import { mapState } from "vuex";

export default defineComponent({
  data() {
    return {
      timeouts: {},
    };
  },
  computed: {
    ...mapState(["alerts"]),
  },
  watch: {
    alerts(current: any[], previous: any[]) {
      if (current.length <= previous.length) {
        return;
      }

      const id = current[current.length - 1].id;
      this.timeouts[id] = window.setTimeout(() => {
        this.$store.commit("pop_alert", id);
        delete this.timeouts[id];
      }, 2500);
    },
  },
  methods: {
    dismiss(id) {
      clearTimeout(this.timeouts[id]);
      this.$store.commit("pop_alert", id);
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
