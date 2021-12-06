<template>
  <b-container>
    <b-row>
      <b-col sm="12">
        <b-card>
          <h5 slot="header" class="mb-0">
            Log
            <small v-if="logFilePath" class="text-muted">
              {{ logFilePath }}
            </small>
          </h5>
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
import { Log } from "@/log";

export default {
  name: "log",
  computed: {
    ...mapState(["log"]),
    logFilePath() {
      return Log.filePath();
    },
  },
  methods: {},
};
</script>
