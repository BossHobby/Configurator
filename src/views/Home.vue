<template>
  <b-container>
    <div class="jumbotron my-5">
      <h1 class="display-4">USB Configurator</h1>
      <div v-if="!serial.is_connected">
        <p class="lead">
          Currently you are disconnected, connect to get started!
        </p>
      </div>
      <div v-if="serial.is_connected">
        <p class="lead">Connected! Select one of the tabs above</p>
      </div>
      <!--
      <b-button
        v-if="status.HasUpdate"
        size="lg"
        variant="success"
        v-on:click="update()"
        class="mx-2"
        >Update</b-button
      >
-->
    </div>
    <b-row>
      <b-col sm="12"><Info></Info></b-col>
    </b-row>
  </b-container>
</template>

<script>
import { mapState } from "vuex";
import Info from "@/components/Info";

export default {
  name: "home",
  components: {
    Info,
  },
  computed: {
    ...mapState(["serial"]),
  },
  methods: {},
};
</script>
