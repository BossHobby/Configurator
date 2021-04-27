<template>
  <b-container>
    <b-row>
      <b-col sm="12">
        <b-card>
          <h5 slot="header" class="mb-0">
            Blackbox

            <b-progress
              class="w-25 mt-2"
              :value="usedSize * 128"
              :max="blackbox.list.flash_size"
              show-progress
            >
            </b-progress>
            <h6>
              Used:
              {{ humanFileSize(usedSize * 128) }} /
              {{ humanFileSize(blackbox.list.flash_size) }}
            </h6>
          </h5>
          <div>
            <div></div>
            <div v-for="(size, index) in blackbox.list.files" :key="index">
              File {{ index + 1 }}: {{ humanFileSize(size * 128) }}
              <b-button
                size="sm"
                class="my-2 mx-2"
                :href="
                  'http://localhost:8000/api/blackbox/' + index + '/download'
                "
                >Download</b-button
              >
            </div>
            <b-row class="my-2" v-if="blackbox.list.files">
              <b-col sm="2">
                <h6 class="mt-4">{{ blackbox.list.files.length }} Files</h6>
              </b-col>
              <b-col offset="8" sm="2">
                <b-button class="my-2 mx-2" variant="danger" @click="reset()"
                  >Reset</b-button
                >
              </b-col>
            </b-row>
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
    ...mapState(["blackbox"]),
    usedSize() {
      return this.blackbox.list.files.reduce((p, c) => p + c, 0);
    },
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
    },

    reset() {
      return this.reset_blackbox().then(() => this.list_blackbox());
    },
  },
  created() {
    this.list_blackbox();
  },
};
</script>
