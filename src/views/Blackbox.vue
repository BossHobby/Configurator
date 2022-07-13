<template>
  <div class="columns">
    <div class="column is-12">
      <div class="card" v-if="blackbox.list">
        <div class="card-header">
          <p class="card-header-title">Blackbox</p>
          <div class="blackbox-progress has-text-right">
            <progress
              class="progress my-0"
              :value="usedSize"
              :max="blackbox.list.flash_size * 1024"
            ></progress>
            <h6>
              Used:
              {{ humanFileSize(usedSize) }} /
              {{ humanFileSize(blackbox.list.flash_size * 1024) }}
            </h6>
          </div>
        </div>

        <div class="card-content">
          <div class="content">
            <div v-for="(file, index) in blackbox.list.files" :key="index">
              File {{ index + 1 }}: {{ humanFileSize(file.size) }}
              <spinner-btn class="is-small my-2 mx-2" @click="download(index)">
                Download
              </spinner-btn>
            </div>
            <a ref="downloadAnchor" target="_blank"></a>
          </div>
        </div>

        <footer class="card-footer">
          <span class="card-footer-item">
            {{ blackbox?.list?.files?.length || 0 }} Files
          </span>
          <span class="card-footer-item"></span>
          <spinner-btn class="card-footer-item is-danger" @click="reset()">
            Reset
          </spinner-btn>
        </footer>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { useBlackboxStore } from "@/store/blackbox";
import { useProfileStore } from "@/store/profile";
import { defineComponent } from "vue";

export default defineComponent({
  name: "blackbox",
  setup() {
    return {
      blackbox: useBlackboxStore(),
      profile: useProfileStore(),
    };
  },
  computed: {
    usedSize() {
      return (this.blackbox?.list?.files || []).reduce((p, c) => p + c.size, 0);
    },
  },
  methods: {
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
      } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

      return bytes.toFixed(dp) + " " + units[u];
    },
    reset() {
      return this.blackbox.reset_blackbox().then(() => this.blackbox.list_blackbox());
    },
    download(index) {
      return this.blackbox.download_blackbox(index).then((url) => {
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
    this.blackbox.list_blackbox();
  },
});
</script>

<style lang="scss">
.blackbox-progress {
  width: 50%;
  margin: 10px;
}
</style>
