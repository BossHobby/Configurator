<template>
  <div id="app">
    <b-navbar>
      <b-navbar-brand to="/">
        <img src="./assets/logo.png" class="d-inline-block" alt="Guano" height="40px" />
        QUICKSILVER
      </b-navbar-brand>
      <b-navbar-nav v-if="status.IsConnected">
        <b-nav-item to="/setup">Setup</b-nav-item>
        <b-nav-item to="/rates">Rates</b-nav-item>
        <b-nav-item to="/channels">Channels</b-nav-item>
        <b-nav-item to="/plot">Plot</b-nav-item>
        <b-nav-item to="/log">Log</b-nav-item>
      </b-navbar-nav>
      <b-navbar-nav v-else>
        <b-nav-item to="/">Home</b-nav-item>
      </b-navbar-nav>
      <b-navbar-nav class="ml-auto">
        <b-nav-form :hidden="!status.IsConnected" ref="form" class="mx-2" right>
          <input type="file" ref="file" style="display: none" />
          <b-button size="sm" class="my-2 my-sm-0" @click="uploadProfile">Upload</b-button>
        </b-nav-form>
        <b-nav-form v-on:submit.prevent="toggle_connection(status.Port)" right>
          <b-button
            size="sm"
            class="my-2 my-sm-0"
            href="http://localhost:8000/api/profile/download"
            :hidden="!status.IsConnected"
          >Download</b-button>
          <b-form-select
            class="mx-3 my-2 my-sm-0"
            id="serial-port"
            v-model="status.Port"
            :options="status.AvailablePorts"
            :disabled="status.IsConnected"
          ></b-form-select>
          <b-button
            size="sm"
            class="my-2 my-sm-0"
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
          show="1"
          dismissible
          fade
        >{{msg}}</b-alert>
      </b-container>
    </div>

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
          :disabled="can_connect"
          v-on:click="toggle_connection(status.Port)"
        >Connect</b-button>
      </div>
    </b-container>
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
    }
  },
  methods: {
    ...mapActions([
      "connect_websocket",
      "fetch_status",
      "toggle_connection",
      "apply_profile"
    ]),
    uploadProfile() {
      this.$refs.file.oninput = () => {
        if (!this.$refs.file.files.length) {
          return;
        }

        const file = this.$refs.file.files[0];
        const formData = new FormData();
        formData.append("file", file);

        fetch("http://localhost:8000/api/profile/upload", {
          method: "POST",
          body: formData
        })
          .then(res => res.json())
          .then(p => this.$store.commit("set_profile", p))
          .then(() => this.$refs.form.reset());
      };

      this.$refs.file.click();
    }
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
  position: absolute;
  right: 0px;
  top: 70px;
  z-index: 10001;
  width: 500px;
}
</style>
