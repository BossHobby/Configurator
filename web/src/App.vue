<template>
  <div id="app">
    <b-navbar>
      <b-navbar-brand to="/">QUICKSILVER</b-navbar-brand>
      <b-navbar-nav>
        <b-nav-item to="/setup">Setup</b-nav-item>
        <b-nav-item to="/rates">Rates</b-nav-item>
        <b-nav-item to="/channels">Channels</b-nav-item>
        <b-nav-item to="/plot">Plot</b-nav-item>
      </b-navbar-nav>
      <b-navbar-nav class="ml-auto">
        <b-nav-form v-on:submit.prevent="toggle_connection(currentPort)" right>
          <b-form-select
            class="mx-3 my-2 my-sm-0"
            id="serial-port"
            v-model="currentPort"
            :options="status.AvailablePorts"
            :disabled="status.IsConnected"
          ></b-form-select>
          <b-button
            size="sm"
            class="my-2 my-sm-0"
            type="submit"
            :disabled="currentPort == ''"
          >{{ status.IsConnected ? 'Disconnect' : 'Connect' }}</b-button>
        </b-nav-form>
      </b-navbar-nav>
    </b-navbar>
    <b-container v-if="status.IsConnected" class="mt-5">
      <router-view></router-view>
      <b-row class="my-5">
        <b-col offset="11" sm="1">
          <b-button v-on:click="apply_profile(profile)">Apply</b-button>
        </b-col>
      </b-row>
    </b-container>
    <b-container v-else class="mt-5">
      <div class="jumbotron my-5">
        <h1 class="display-4">USB Configurator</h1>
        <p class="lead">Currently you are disconnected, connect to get started!</p>
        <b-button
          size="lg"
          variant="primary"
          :disabled="currentPort == ''"
          v-on:click="toggle_connection(currentPort)"
        >Connect</b-button>
      </div>
    </b-container>
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";

export default {
  name: "app",
  data() {
    return {
      currentPort: ""
    };
  },
  computed: {
    ...mapState(["status", "profile"])
  },
  methods: {
    ...mapActions(["fetch_status", "toggle_connection", "apply_profile"])
  },
  created() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.fetch_status().then(() => {
      if (
        this.currentPort == "" &&
        this.status.AvailablePorts &&
        this.status.AvailablePorts.length
      ) {
        this.currentPort = this.status.AvailablePorts[0];
      }
    });
    this.interval = setInterval(() => {
      this.fetch_status().then(() => {
        this.currentPort = this.status.Port;
        if (
          this.currentPort == "" &&
          this.status.AvailablePorts &&
          this.status.AvailablePorts.length
        ) {
          this.currentPort = this.status.AvailablePorts[0];
        }
      });
    }, 2500);
  },
  destroyed() {
    clearInterval(this.interval);
  }
};
</script>

<style>
</style>
