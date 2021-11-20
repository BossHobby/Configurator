<template>
  <div id="app">
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
      <b-navbar-nav v-if="status.IsConnected">
        <b-nav-item to="/profile">Profile</b-nav-item>
        <b-nav-item to="/setup">Setup</b-nav-item>
        <b-nav-item to="/rates">Rates</b-nav-item>
        <b-nav-item to="/receiver">Receiver</b-nav-item>
        <b-nav-item v-if="has_feature(FEATURE_OSD)" to="/osd">OSD</b-nav-item>
        <b-nav-item to="/motor">Motor</b-nav-item>
        <b-nav-item
          v-if="
            has_feature(FEATURE_BLACKBOX) &&
            status.Info.quic_protocol_version > 1
          "
          to="/blackbox"
          >Blackbox</b-nav-item
        >
        <b-nav-item to="/state">State</b-nav-item>
        <b-nav-item
          v-if="
            has_feature(FEATURE_DEBUG) && status.Info.quic_protocol_version > 1
          "
          to="/perf"
          >Perf</b-nav-item
        >
      </b-navbar-nav>
      <b-navbar-nav v-else>
        <b-nav-item to="/">Home</b-nav-item>
        <b-nav-item to="/flash">Flash</b-nav-item>
      </b-navbar-nav>
      <b-navbar-nav class="ml-auto">
        <b-nav-form v-on:submit.prevent="toggle_connection(status.Port)" right>
          <b-form-select
            class="mx-3 my-2"
            id="serial-port"
            v-model="status.Port"
            :options="status.AvailablePorts"
            :disabled="status.IsConnected"
          ></b-form-select>
          <b-button
            size="sm"
            class="my-2"
            type="submit"
            :disabled="!can_connect"
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

    <b-navbar v-if="status.IsConnected" fixed="bottom" class="navbar">
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
        <b-button class="my-1 mx-2" v-on:click="soft_reboot()">Reboot</b-button>
        <b-button class="my-1 mx-2" v-on:click="apply_profile(profile)"
          >Apply</b-button
        >
      </b-navbar-nav>
    </b-navbar>
  </div>
</template>

<script>
import { mapActions, mapState, mapGetters } from "vuex";
import {
  FEATURE_BLACKBOX,
  FEATURE_OSD,
  FEATURE_DEBUG,
} from "@/store/constants.js";

export default {
  name: "app",
  data() {
    return {
      FEATURE_BLACKBOX,
      FEATURE_OSD,
      FEATURE_DEBUG,
    };
  },
  computed: {
    ...mapState(["status", "profile", "alerts", "state"]),
    ...mapGetters(["can_connect", "has_feature"]),
    date() {
      return new Date(this.profile.meta.datetime * 1000);
    },
    connectButtonText() {
      if (this.status.IsConnecting) {
        return "Connecting...";
      }
      if (this.status.IsConnected) {
        return "Disconnect";
      }
      return "Connect";
    },
  },
  methods: {
    ...mapActions([
      "connect_websocket",
      "fetch_status",
      "toggle_connection",
      "apply_profile",
      "soft_reboot",
    ]),
  },
  created() {
    this.connect_websocket();
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
