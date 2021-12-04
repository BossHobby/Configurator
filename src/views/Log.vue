<template>
  <b-container>
    <b-row>
      <b-col sm="12">
        <b-card>
          <h5 slot="header" class="mb-0">Log</h5>
          <div v-for="(line, index) in log" :key="line + '-' + index">
            <samp>>> {{ line }}</samp>
          </div>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "log",
  computed: {
    ...mapState(["log"]),
  },
  methods: {},
};
</script>
