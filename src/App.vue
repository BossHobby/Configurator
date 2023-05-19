<template>
  <div class="overlay" v-if="updateProcessing" no-wrap z-index="9999">
    <div class="text-center">
      <span class="icon">
        <i class="fas fa-spinner fa-pulse"></i>
      </span>
      <h1>Updating...</h1>
    </div>
  </div>

  <nav
    class="navbar is-fixed-top is-primary"
    role="navigation"
    aria-label="main navigation"
  >
    <div class="navbar-brand">
      <router-link class="navbar-item py-1" to="/profile">
        <LogoTextDevelop
          v-if="branch == 'develop'"
          viewBox="0 0 512 130"
          class="text"
        />
        <LogoText v-else viewBox="0 0 512 82" class="text" />
      </router-link>

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
        <router-link active-class="is-active" class="navbar-item" to="/profile"
          >Profile</router-link
        >
        <router-link
          active-class="is-active"
          class="navbar-item"
          to="/templates"
          >Templates</router-link
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
          v-if="
            info.has_feature(Features.BLACKBOX) &&
            info.quic_protocol_version > 1
          "
          class="navbar-item"
          to="/blackbox"
          >Blackbox</router-link
        >
        <router-link active-class="is-active" class="navbar-item" to="/state"
          >State</router-link
        >
        <router-link
          active-class="is-active"
          v-if="
            info.has_feature(Features.DEBUG) && info.quic_protocol_version > 1
          "
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
        <div class="navbar-item">
          <div class="buttons">
            <button class="button is-primary" @click="setDarkMode(!darkMode)">
              <font-awesome-icon
                v-if="!darkMode"
                icon="fa-solid fa-cloud-moon"
                size="lg"
                fixed-width
              />
              <font-awesome-icon
                v-else
                icon="fa-solid fa-cloud-sun"
                size="lg"
                fixed-width
              />
            </button>
            <spinner-btn
              class="button is-primary"
              @click="serial.toggle_connection"
              :disabled="!canConnect"
            >
              {{ connectButtonText }}
            </spinner-btn>
          </div>
        </div>
      </div>
    </div>
  </nav>

  <AlertPortal />
  <ModalPortal />

  <div class="container router-outlet-container">
    <router-view></router-view>
  </div>

  <div v-if="serial.is_connected" class="navbar is-fixed-bottom has-shadow">
    <div class="navbar-brand">
      <span class="navbar-item is-size-4">
        {{ profile.meta.name }}
      </span>
      <span class="navbar-item">Modified {{ timeAgo(date) }}</span>
      <span class="navbar-item" style="font-size: 70%">
        Looptime {{ state.looptime_autodetect }} CPU Load
        {{ state.cpu_load }}
      </span>
      <span class="navbar-item" style="font-size: 60%">
        CPU Temp {{ state.cpu_temp.toFixed(2) }}°C
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
        class="navbar-item is-primary my-auto mx-2"
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
import ModalPortal from "@/components/ModalPortal.vue";
import SelectModal from "@/components/SelectModal.vue";
import { useInfoStore } from "./store/info";
import { useProfileStore } from "./store/profile";
import { useStateStore } from "./store/state";
import { useSerialStore } from "./store/serial";
import { useRootStore } from "./store/root";
import { useConstantStore } from "./store/constants";
import { computed } from "vue";

import LogoClean from "./assets/Logo_Clean.svg?component";
import LogoText from "./assets/Logo_Text.svg?component";
import LogoTextDevelop from "./assets/Logo_Develop_Text.svg?component";
import { github } from "./store/util/github";

export default defineComponent({
  name: "app",
  components: {
    LogoClean,
    LogoText,
    LogoTextDevelop,
    RouterLink,
    RouterView,
    AlertPortal,
    ModalPortal,
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
  data() {
    return {
      darkMode: true,
      branch: import.meta.env.VITE_BRANCH_NAME,
    };
  },
  watch: {
    darkMode(newVal, oldVal) {
      if (newVal == oldVal) {
        return;
      }
      if (!document.firstElementChild) {
        return;
      }
      if (newVal) {
        document.firstElementChild.className = "theme-dark";
      } else {
        document.firstElementChild.className = "";
      }
    },
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
      return !this.serial.is_connecting && this.$route.name != "flash";
    },
    updateProcessing() {
      return updater.updatePreparing() || updater.updatePending();
    },
  },
  methods: {
    timeAgo,
    getDarkMode() {
      if (localStorage.getItem("dark-mode")) {
        return localStorage.getItem("dark-mode") == "true";
      }

      const mediaQuerry = window.matchMedia("(prefers-color-scheme: light)");
      if (mediaQuerry.matches) {
        return false;
      }

      return true;
    },
    setDarkMode(val: boolean) {
      localStorage.setItem("dark-mode", val ? "true" : "false");
      this.darkMode = val;
    },
    selectSerial(event, ports) {
      this.$modal
        .show(SelectModal, {
          title: "Serial",
          options: ports.map((p) => {
            return {
              text: p.displayName + " " + p.portName,
              value: p.portId,
            };
          }),
        })
        .then((value) => {
          return event.sender.send("serial", value);
        });
    },
    selectUSBDevice(event, devices) {
      this.$modal
        .show(SelectModal, {
          title: "USB Device",
          options: devices.map((d) => {
            return {
              text: d.productName,
              value: d.deviceId,
            };
          }),
        })
        .then((value) => {
          return event.sender.send("usb-device", value);
        });
    },
  },
  created() {
    this.darkMode = this.getDarkMode();
    if (updater.updatePending()) {
      updater.finishUpdate();
    }

    window.electron?.ipcRenderer.on("select-serial", this.selectSerial);
    window.electron?.ipcRenderer.on("select-usb-device", this.selectUSBDevice);
  },
  unmounted() {
    clearInterval(this.interval);
    window.electron?.ipcRenderer.removeAllListeners("select-serial");
    window.electron?.ipcRenderer.removeAllListeners("select-usb-device");
  },
});
</script>

<style lang="scss">
.navbar.is-primary .navbar-brand > a.navbar-item:focus {
  background-color: unset !important;
}
.navbar-item .notification {
  padding: 15px !important;
  margin-bottom: 0 !important;
}
.router-outlet-container {
  margin-top: 6rem !important;
  margin-bottom: 6rem !important;
}
</style>

<style lang="scss" scoped>
.logo {
  display: inline-block;
  height: 100%;
  width: 76px;
  transform: scale(0.99);
}
.text {
  display: inline-block;
  width: 175px;
  height: 100%;
  margin-left: -8px;
}
</style>
