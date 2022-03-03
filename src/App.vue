<template>
  <div id="app">
    <b-overlay :show="updateProcessing" no-wrap z-index="9999">
      <template #overlay>
        <div class="text-center">
          <b-spinner class="float-center" label="Spinning"></b-spinner>
          <h1>Updating...</h1>
        </div>
      </template>
    </b-overlay>

    <b-navbar fixed="top" class="navbar-top">
      <b-navbar-brand to="/">
        <img
          src="./assets/logo.png"
          class="d-inline-block"
          alt="Guano"
          height="40px"
        />
        QUICKSILVER
      </b-navbar-brand>
      <b-navbar-nav v-if="serial.is_connected">
        <b-nav-item to="/profile">Profile</b-nav-item>
        <b-nav-item to="/setup">Setup</b-nav-item>
        <b-nav-item to="/rates">Rates</b-nav-item>
        <b-nav-item to="/receiver">Receiver</b-nav-item>
        <b-nav-item v-if="has_feature(Features.OSD)" to="/osd">OSD</b-nav-item>
        <b-nav-item to="/motor">Motor</b-nav-item>
        <b-nav-item
          v-if="
            has_feature(Features.BLACKBOX) && info.quic_protocol_version > 1
          "
          to="/blackbox"
          >Blackbox</b-nav-item
        >
        <b-nav-item to="/state">State</b-nav-item>
        <b-nav-item
          v-if="has_feature(Features.DEBUG) && info.quic_protocol_version > 1"
          to="/perf"
          >Perf</b-nav-item
        >
        <b-nav-item to="/log">Log</b-nav-item>
      </b-navbar-nav>
      <b-navbar-nav v-else>
        <b-nav-item to="/">Home</b-nav-item>
        <b-nav-item to="/flash">Flash</b-nav-item>
        <b-nav-item to="/log">Log</b-nav-item>
      </b-navbar-nav>
      <b-navbar-nav class="ml-auto">
        <b-nav-form v-on:submit.prevent="toggle_connection()" right>
          {{ serial.port }}
          <b-button
            size="sm"
            class="my-2"
            type="submit"
            :disabled="!canConnect"
          >
            {{ connectButtonText }}
          </b-button>
        </b-nav-form>
      </b-navbar-nav>
    </b-navbar>

    <div class="alert-portal">
      <b-container>
        <b-alert
          v-for="(alert, index) in alerts"
          :key="index"
          :variant="alert.type"
          show="2.0"
          dismissible
          fade
          >{{ alert.msg }}</b-alert
        >
      </b-container>
    </div>

    <router-view style="margin-top: 5rem; margin-bottom: 5rem"></router-view>

    <b-navbar v-if="serial.is_connected" fixed="bottom" class="navbar">
      <b-navbar-brand>
        {{ profile.meta.name }}
        <small class="text-muted ml-2"
          >Modified {{ date | moment("from") }}</small
        >
        <small class="text-muted ml-2" style="font-size: 60%"
          >Looptime {{ state.looptime_autodetect }} CPU Load
          {{ state.cpu_load }}</small
        >
      </b-navbar-brand>
      <b-navbar-nav class="ml-auto">
        <b-alert :show="needs_apply" class="mb-0" variant="warning">
          <b-icon icon="exclamation-triangle"></b-icon>
          Unsaved changes
        </b-alert>
        <b-alert
          :show="!needs_apply && needs_reboot"
          class="mb-0"
          variant="warning"
        >
          <b-icon icon="exclamation-triangle"></b-icon>
          Reboot required
        </b-alert>
        <spinner-btn class="my-1 mx-2" v-on:click="soft_reboot()">
          Reboot
        </spinner-btn>
        <spinner-btn
          class="my-1 mx-2"
          v-on:click="apply_profile(profile)"
          :disabled="is_read_only"
        >
          Apply
        </spinner-btn>
      </b-navbar-nav>
    </b-navbar>
  </div>
</template>

<script>
import { updater } from "@/store/util/updater";
import { mapActions, mapState, mapGetters } from "vuex";
import { Features } from "@/store/constants";

export default {
  name: "app",
  data() {
    return {
      Features,
    };
  },
  computed: {
    ...mapState([
      "info",
      "profile",
      "alerts",
      "state",
      "serial",
      "needs_reboot",
      "needs_apply",
    ]),
    ...mapGetters(["has_feature", "is_read_only"]),
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
    ...mapActions(["toggle_connection", "apply_profile", "soft_reboot"]),
  },
  created() {
    if (updater.updatePending()) {
      updater.finishUpdate();
    }
  },
  destroyed() {
    clearInterval(this.interval);
  },
};
</script>

<style>
.alert-portal {
  position: fixed;
  right: 5px;
  top: 85px;
  z-index: 10001;
  width: 500px;
}
.navbar {
  background-color: #fff;
  box-shadow: 0px 0px 1px 0px #000;
}
</style>
