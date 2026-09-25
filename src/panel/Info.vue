<template>
  <section class="rounded-lg border border-line bg-panel p-6">
    <p class="mb-2 text-xs font-medium uppercase tracking-widest text-muted">
      QUICKSILVER Configurator · {{ appVersion }}
    </p>
    <h1 class="text-2xl font-semibold text-ink">Ready for Your Next Flight</h1>
    <p class="mt-3 max-w-xl text-sm text-muted">
      Connect your flight controller to configure your craft, check receiver
      inputs, and tune its response.
    </p>
    <div class="mt-5 flex flex-wrap items-center gap-4">
      <a
        href="https://docs.bosshobby.com/"
        target="_blank"
        rel="noreferrer"
        class="text-sm font-medium text-accent"
        >Getting started ↗</a
      >
      <spinner-btn v-if="updateAvailable" @click="doUpdate"
        >Update available · Install</spinner-btn
      >
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { updater } from "@/store/util/updater";

import LogoClean from "@/assets/Logo_Clean.svg?component";

export default defineComponent({
  name: "Info",
  components: {
    LogoClean,
  },
  data() {
    return {
      updateAvailable: null,
      appVersion: import.meta.env.VITE_APP_VERSION,
    };
  },
  created() {
    if (!updater.updatePending()) {
      updater.checkForUpdate(
        this.appVersion,
        (updateAvailable) => (this.updateAvailable = updateAvailable),
      );
    }
  },
  methods: {
    doUpdate() {
      return updater.update(this.updateAvailable);
    },
  },
});
</script>

<style lang="scss">
.logo {
  display: block;
  height: 100%;
  width: 100%;
  transform: scale(0.99);
}
</style>
