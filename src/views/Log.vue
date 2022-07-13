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
        <div class="card-content">
          <div class="content">
            <div v-for="(line, index) in root.log" :key="line + '-' + index">
              <samp>>> {{ line }}</samp>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Log } from "@/log";
import { useRootStore } from "@/store/root";

export default defineComponent({
  name: "Log",
  setup() {
    return {
      root: useRootStore(),
    };
  },
  computed: {
    logFilePath() {
      return Log.filePath();
    },
  },
  methods: {},
});
</script>
