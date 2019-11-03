<template>
  <b-row>
    <b-col sm="12">
      <b-card>
        <h5 slot="header" class="mb-0">Log</h5>
        <samp v-for="line in log" :key="line">>> {{line}}</samp>
      </b-card>
    </b-col>
  </b-row>
</template>

<script>
import { mapActions, mapState } from "vuex";

export default {
  name: "log",
  computed: mapState(["log"]),
  methods: {
    ...mapActions(["set_blackbox_rate"])
  },
  created() {
    this.set_blackbox_rate(4);
  }
};
</script>
