<template>
  <b-container>
    <div class="jumbotron my-5">
      <h1 class="display-4">USB Configurator</h1>
      <p class="lead">Currently you are disconnected, connect to get started!</p>
      <b-button
        size="lg"
        variant="primary"
        :disabled="can_connect"
        v-on:click="toggle_connection(status.Port)"
      >Connect</b-button>

      <b-button
        v-if="status.HasUpdate"
        size="lg"
        variant="success"
        v-on:click="update()"
        class="mx-2"
      >Update</b-button>
    </div>
  </b-container>
</template>

<script>
import { mapActions, mapState } from "vuex";

export default {
  name: "home",
  computed: {
    ...mapState(["status"]),
    can_connect() {
      return !this.status.Port || this.status.Port.length == 0;
    }
  },
  methods: {
    ...mapActions(["toggle_connection", "update"])
  }
};
</script>
