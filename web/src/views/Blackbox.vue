<template>
  <b-container>
    <b-row>
      <b-col sm="12">
        <b-card>
          <h5 slot="header" class="mb-0">Blackbox</h5>
          <div>
            <div
              v-for="(size, index) in blackbox.list.files"
              :key="index"
            >File {{index + 1}}: {{ humanFileSize(size * 128) }}</div>
            <b-button size="sm" class="my-2 mx-2" @click="list_blackbox()">list</b-button>
            <b-button size="sm" class="my-2 mx-2" @click="fetch()">fetch</b-button>
            <b-button
              size="sm"
              class="my-2 mx-2"
              href="http://localhost:8000/api/blackbox/download"
            >download</b-button>
            <b-button size="sm" class="my-2 mx-2" @click="reset_blackbox()">reset</b-button>
          </div>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { mapState, mapActions } from "vuex";

export default {
  name: "blackbox",
  computed: {
    ...mapState(["blackbox"])
  },
  methods: {
    ...mapActions(["reset_blackbox", "list_blackbox"]),
    humanFileSize(bytes, si = false, dp = 1) {
      const thresh = si ? 1000 : 1024;

      if (Math.abs(bytes) < thresh) {
        return bytes + " B";
      }

      const units = si
        ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
        : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
      let u = -1;
      const r = 10 ** dp;

      do {
        bytes /= thresh;
        ++u;
      } while (
        Math.round(Math.abs(bytes) * r) / r >= thresh &&
        u < units.length - 1
      );

      return bytes.toFixed(dp) + " " + units[u];
    }
  }
};
</script>
