<template>
  <div class="overlay" v-if="updateProcessing" no-wrap z-index="9999">
    <div class="text-center">
      <span class="icon">
        <i class="fas fa-spinner fa-pulse"></i>
      </span>
      <h1>Updating...</h1>
    </div>
  </div>

  <nav class="navbar is-fixed-top" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <a class="navbar-item px-1">
        <img
          src="./assets/Logo_Clean.svg"
          style="display: inline-block; max-height: 55px"
          class="image"
        />
        <img
          src="./assets/Logo_Text.svg"
          style="display: inline-block; margin-left: -2px; max-width: 175px"
          class="image"
        />
      </a>

      <a
        role="button"
        class="navbar-burger"
        aria-label="menu"
        aria-expanded="false"
        data-target="mainMavbar"
      >
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </a>
    </div>

    <div id="mainMavbar" class="navbar-menu">
      <div v-if="serial.is_connected" class="navbar-start">
        <router-link active-class="is-active" class="navbar-item" to="/templates"
          >Templates</router-link
        >
        <router-link active-class="is-active" class="navbar-item" to="/profile"
          >Profile</router-link
        >
        <router-link active-class="is-active" class="navbar-item" to="/setup"
          >Setup</router-link
        >
        <router-link active-class="is-active" class="navbar-item" to="/rates"
          >Rates</router-link
        >
        <router-link active-class="is-active" class="navbar-item" to="/receiver"
          >Receiver</router-link
        >
        <router-link
          active-class="is-active"
          v-if="info.has_feature(Features.OSD)"
          class="navbar-item"
          to="/osd"
          >OSD</router-link
        >
        <router-link active-class="is-active" class="navbar-item" to="/motor"
          >Motor</router-link
        >
        <router-link
          active-class="is-active"
          v-if="info.has_feature(Features.BLACKBOX) && info.quic_protocol_version > 1"
          class="navbar-item"
          to="/blackbox"
          >Blackbox</router-link
        >
        <router-link active-class="is-active" class="navbar-item" to="/state"
          >State</router-link
        >
        <router-link
          active-class="is-active"
          v-if="info.has_feature(Features.DEBUG) && info.quic_protocol_version > 1"
          class="navbar-item"
          to="/perf"
          >Perf</router-link
        >
        <router-link active-class="is-active" class="navbar-item" to="/log"
          >Log</router-link
        >
      </div>
      <div v-else class="navbar-start">
        <router-link active-class="is-active" class="navbar-item" to="/"
          >Home</router-link
        >
        <router-link active-class="is-active" class="navbar-item" to="/flash"
          >Flash</router-link
        >
        <router-link active-class="is-active" class="navbar-item" to="/log"
          >Log</router-link
        >
      </div>

      <div class="navbar-end">
        <spinner-btn
          class="navbar-item button my-2 mr-2 is-primary"
          @click="serial.toggle_connection"
          :disabled="!canConnect"
        >
          {{ connectButtonText }}
        </spinner-btn>
      </div>
    </div>
  </nav>

  <AlertPortal />

  <div class="container router-outlet-container">
    <router-view></router-view>
  </div>

  <div v-if="serial.is_connected" class="navbar is-fixed-bottom">
    <div class="navbar-brand">
      <span class="navbar-item is-size-4">
        {{ profile.meta.name }}
      </span>
      <span class="navbar-item">Modified {{ timeAgo(date) }}</span>
      <span class="navbar-item" style="font-size: 70%">
        Looptime {{ state.looptime_autodetect }} CPU Load
        {{ state.cpu_load }}
      </span>
    </div>

    <div class="navbar-end">
      <span class="navbar-item">
        <div class="notification is-warning" v-show="root.needs_apply">
          <font-awesome-icon icon="fa-solid fa-triangle-exclamation" />
          Unsaved changes
        </div>
        <div
          class="notification is-warning"
          v-show="!root.needs_apply && root.needs_reboot"
        >
          <font-awesome-icon icon="fa-solid fa-triangle-exclamation" />
          Reboot required
        </div>
      </span>

      <spinner-btn
        class="navbar-item is-warning my-auto mx-2"
        @click="serial.soft_reboot()"
      >
        Reboot
      </spinner-btn>
      <spinner-btn
        class="navbar-item is-info my-auto mx-2"
        @click="profile.apply_profile(profile.$state)"
        :disabled="info.is_read_only"
      >
        Apply
      </spinner-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { updater } from "@/store/util/updater";
import { RouterLink, RouterView } from "vue-router";
import { timeAgo } from "@/mixin/filters";
import AlertPortal from "@/components/AlertPortal.vue";
import { useInfoStore } from "./store/info";
import { useProfileStore } from "./store/profile";
import { useStateStore } from "./store/state";
import { useSerialStore } from "./store/serial";
import { useRootStore } from "./store/root";
import { useConstantStore } from "./store/constants";
import { computed } from "vue";

export default defineComponent({
  name: "app",
  components: {
    RouterLink,
    RouterView,
    AlertPortal,
  },
  setup() {
    const constants = useConstantStore();

    return {
      info: useInfoStore(),
      profile: useProfileStore(),
      state: useStateStore(),
      serial: useSerialStore(),
      root: useRootStore(),

      Features: computed(() => constants.Features),
    };
  },
  computed: {
    availablePortOptions() {
      return this.serial.available.map((p) => {
        return {
          value: p,
          text: p.name,
        };
      });
    },
    date() {
      return new Date(this.profile.meta.datetime * 1000);
    },
    connectButtonText() {
      if (this.serial.is_connecting) {
        return "Connecting...";
      }
      if (this.serial.is_connected) {
        return "Disconnect";
      }
      return "Connect";
    },
    canConnect() {
      return !this.serial.is_connecting;
    },
    updateProcessing() {
      return updater.updatePreparing() || updater.updatePending();
    },
  },
  methods: {
    timeAgo,
  },
  created() {
    if (updater.updatePending()) {
      updater.finishUpdate();
    }
  },
  unmounted() {
    clearInterval(this.interval);
  },
});
</script>

<style lang="scss">
.navbar-item .notification {
  padding: 15px !important;
  margin-bottom: 0 !important;
}
.router-outlet-container {
  margin-top: 5rem !important;
  margin-bottom: 4rem !important;
}
</style>
