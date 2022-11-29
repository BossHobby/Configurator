<template>
  <div class="columns">
    <div class="column is-12">
      <div class="card" v-if="blackbox.list">
        <div class="card-header">
          <p class="card-header-title">Blackbox</p>
          <div class="blackbox-progress has-text-right">
            <progress
              class="progress my-0 is-danger"
              :value="usedSize"
              :max="(blackbox.list.flash_size || 1) * 1024"
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
            <div
              v-for="(file, index) in blackbox.list.files"
              :key="index"
              class="is-flex is-align-items-center"
            >
              <div class="mr-4 is-size-6">
                File {{ index + 1 }}: {{ humanFileSize(file.size) }}
              </div>
              <spinner-btn
                class="is-small my-2 mx-2"
                @click="download_btfl(index)"
              >
                <font-awesome-icon
                  icon="fa-solid fa-download"
                  size="lg"
                  class="mr-2"
                  fixed-width
                />
                BTFL
              </spinner-btn>
              <spinner-btn
                class="is-small my-2 mx-2"
                @click="download_quic(index)"
              >
                <font-awesome-icon
                  icon="fa-solid fa-download"
                  size="lg"
                  class="mr-2"
                  fixed-width
                />
                QUIC
              </spinner-btn>
            </div>
            <a ref="downloadAnchor" target="_blank"></a>
            <div v-if="blackbox.progress">
              Downloading {{ humanFileSize(blackbox.speed || 0) }}/s...
              <progress
                class="progress is-info my-0"
                :value="blackbox.progress"
                max="1"
              ></progress>
            </div>
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
import { humanFileSize } from "@/mixin/filters";
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
    humanFileSize,
    reset() {
      return this.blackbox
        .reset_blackbox()
        .then(() => this.blackbox.list_blackbox());
    },
    download_quic(index) {
      return this.blackbox.download_blackbox_quic(index).then((url) => {
        const date = new Date().toISOString().substring(0, 10);
        const name = this.profile.meta.name.replace(/\0/g, "");
        const filename = `${name}_${date}_file_${index}.json`;

        this.$refs.downloadAnchor.setAttribute("href", url);
        this.$refs.downloadAnchor.setAttribute("download", filename);
        this.$refs.downloadAnchor.click();
      });
    },
    download_btfl(index) {
      return this.blackbox.download_blackbox_btfl(index).then((url) => {
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
