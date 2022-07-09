<template>
  <div class="jumbotron">
    <h1 class="display-4 mb-4">
      QUICKSILVER
      <small class="text-muted">{{ appVersion }}</small>
    </h1>
    <p class="lead">
      Checkout our
      <a target="_blank" href="https://github.com/BossHobby/QUICKSILVER/wiki"> wiki </a>
      for help on getting started.
    </p>
    <p class="lead" v-if="updateAvailable">New Version available!</p>
    <b-button v-if="updateAvailable" variant="success" size="small" @click="doUpdate">
      Update Now
    </b-button>
  </div>
</template>

<script>
import { updater } from "@/store/util/updater";

export default {
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
};
</script>
