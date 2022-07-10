<template>
  <div class="columns">
    <div class="column is-12">
      <div class="card">
        <header class="card-header">
          <p class="card-header-title">Log</p>
          <small v-if="logFilePath" class="card-header-icon">
            {{ logFilePath }}
          </small>
        </header>

        <div v-for="(line, index) in log" :key="line + '-' + index">
          <samp>>> {{ line }}</samp>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapState } from "vuex";
import { Log } from "@/log";

export default defineComponent({
  name: "log",
  computed: {
    ...mapState(["log"]),
    logFilePath() {
      return Log.filePath();
    },
  },
  methods: {},
});
</script>
