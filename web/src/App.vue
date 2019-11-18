<template>
  <div id="app">
    <b-navbar fixed="top" class="navbar-top">
      <b-navbar-brand to="/">
        <img src="./assets/logo.png" class="d-inline-block" alt="Guano" height="40px" />
        QUICKSILVER
      </b-navbar-brand>
      <b-navbar-nav v-if="status.IsConnected">
        <b-nav-item to="/profile">Profile</b-nav-item>
        <b-nav-item to="/setup">Setup</b-nav-item>
        <b-nav-item to="/rates">Rates</b-nav-item>
        <b-nav-item to="/channels">Channels</b-nav-item>
        <b-nav-item to="/blackbox">Blackbox</b-nav-item>
        <b-nav-item to="/log">Log</b-nav-item>
      </b-navbar-nav>
      <b-navbar-nav v-else>
        <b-nav-item to="/">Home</b-nav-item>
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
            :disabled="can_connect"
          >{{ status.IsConnected ? 'Disconnect' : 'Connect' }}</b-button>
        </b-nav-form>
      </b-navbar-nav>
    </b-navbar>

    <div class="alert-portal">
      <b-container>
        <b-alert
          v-for="(msg, index) in alerts"
          :key="index"
          variant="success"
          show="2.0"
          dismissible
          fade
        >{{msg}}</b-alert>
      </b-container>
    </div>

    <b-container v-if="status.IsConnected" style="margin-top: 5rem; margin-bottom: 5rem;">
      <router-view></router-view>
    </b-container>
    <b-container v-else style="margin-top: 5rem; margin-bottom: 5rem;">
      <div class="jumbotron my-5">
        <h1 class="display-4">USB Configurator</h1>
        <p class="lead">Currently you are disconnected, connect to get started!</p>
        <b-button
          size="lg"
          variant="primary"
          :disabled="can_connect"
          v-on:click="toggle_connection(status.Port)"
        >Connect</b-button>
      </div>
    </b-container>

    <b-navbar v-if="status.IsConnected" fixed="bottom" class="navbar">
      <b-navbar-brand>
        {{ profile.meta.name }}
        <small class="text-muted ml-2">Modified {{ date | moment("from") }}</small>
      </b-navbar-brand>
      <b-navbar-nav class="ml-auto">
        <b-button class="my-1 mx-2" v-on:click="soft_reboot()">Reboot</b-button>
        <b-button class="my-1 mx-2" v-on:click="apply_profile(profile)">Apply</b-button>
      </b-navbar-nav>
    </b-navbar>
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";

export default {
  name: "app",
  computed: {
    ...mapState(["status", "profile", "alerts"]),
    can_connect() {
      return !this.status.Port || this.status.Port.length == 0;
    },
    date() {
      return new Date(this.profile.meta.datetime * 1000);
    }
  },
  methods: {
    ...mapActions([
      "connect_websocket",
      "fetch_status",
      "toggle_connection",
      "apply_profile",
      "soft_reboot"
    ])
  },
  created() {
    this.connect_websocket();
  },
  destroyed() {
    clearInterval(this.interval);
  }
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
