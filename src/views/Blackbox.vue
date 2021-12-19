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
              :max="blackbox.list.flash_size * 1024"
              show-progress
            >
            </b-progress>
            <h6>
              Used:
              {{ humanFileSize(usedSize * 128) }} /
              {{ humanFileSize(blackbox.list.flash_size * 1024) }}
            </h6>
          </h5>
          <div>
            <div v-for="(size, index) in blackbox.list.files" :key="index">
              File {{ index + 1 }}: {{ humanFileSize(size * 128) }}
              <spinner-btn size="sm" class="my-2 mx-2" @click="download(index)">
                Download
              </spinner-btn>
            </div>
            <b-row class="my-2" v-if="blackbox.list.files">
              <b-col sm="2">
                <h6 class="mt-4">{{ blackbox.list.files.length }} Files</h6>
              </b-col>
              <b-col offset="8" sm="2">
                <spinner-btn
                  class="my-2 mx-2"
                  variant="danger"
                  @click="reset()"
                >
                  Reset
                </spinner-btn>
              </b-col>
            </b-row>
            <a ref="downloadAnchor" target="_blank"></a>
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
    ...mapState(["blackbox", "profile"]),
    usedSize() {
      return (this.blackbox?.list?.files || []).reduce((p, c) => p + c, 0);
    },
  },
  methods: {
    ...mapActions(["reset_blackbox", "list_blackbox", "download_blackbox"]),
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
    download(index) {
      return this.download_blackbox(index).then((url) => {
        const date = new Date().toISOString().substring(0, 10);
        const name = this.profile.meta.name.replace(/\0/g, "");
        const filename = `${name}_${date}_file_${index}.bfl`;

        this.$refs.downloadAnchor.setAttribute("href", url);
        this.$refs.downloadAnchor.setAttribute("download", filename);
        this.$refs.downloadAnchor.click();
      });
    },
  },
  created() {
    this.list_blackbox();
  },
};
</script>
