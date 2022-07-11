<template>
  <section class="hero is-primary">
    <div class="hero-body">
      <p class="title">
        QUICKSILVER
        <small class="text-muted">{{ appVersion }}</small>
      </p>
      <p class="subtitle">
        Checkout our
        <a target="_blank" href="https://github.com/BossHobby/QUICKSILVER/wiki"> wiki </a>
        for help on getting started.
      </p>
      <p class="subtitle" v-if="updateAvailable">New Version available!</p>
      <button v-if="updateAvailable" class="button is-success is-small" @click="doUpdate">
        Update Now
      </button>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { updater } from "@/store/util/updater";

export default defineComponent({
  name: "Info",
  data() {
    return {
      updateAvailable: null,
      appVersion: import.meta.env.VITE_APP_VERSION,
    };
  },
  methods: {
    doUpdate() {
      return updater.update(this.updateAvailable);
    },
  },
  created() {
    if (!updater.updatePending()) {
      updater.checkForUpdate(
        this.appVersion,
        (updateAvailable) => (this.updateAvailable = updateAvailable)
      );
    }
  },
});
</script>
