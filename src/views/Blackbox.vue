<template>
  <div class="columns is-multiline">
    <div class="column is-12">
      <div class="card" v-if="info.quicVersionGt('0.1.2')">
        <div class="card-header">
          <p class="card-header-title">Blackbox Settings</p>
        </div>
        <div class="card-content">
          <div class="content column-narrow">
            <div class="field field-is-2 is-horizontal">
              <div class="field-label">
                <label class="label" for="pid-preset"> Preset </label>
              </div>
              <div class="field-body">
                <div class="field has-addons">
                  <div class="control">
                    <input-select
                      id="blackbox-preset"
                      v-model.number="current_preset"
                      :options="blackboxPresets"
                    ></input-select>
                  </div>
                  <div class="control">
                    <spinner-btn
                      @click="load_preset(current_preset)"
                      :disabled="current_preset == -1"
                    >
                      Load
                    </spinner-btn>
                  </div>
                </div>
              </div>
            </div>

            <div class="field field-is-2 is-horizontal">
              <div class="field-label">
                <label class="label">Log Rate</label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      class="input is-static"
                      :value="blackboxRate"
                      readonly
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="field field-is-2 is-horizontal">
              <div class="field-label is-align-self-flex-start pt-2">
                <label class="label">Fields</label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      v-for="f of blackboxFields"
                      :key="f"
                      class="input is-static"
                      :value="f"
                      readonly
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="column is-12">
      <div class="card" v-if="blackbox.list">
        <div class="card-header">
          <p class="card-header-title">Blackbox Files</p>
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
import {
  useBlackboxStore,
  BlackboxFields,
  transformBlackboxFieldFlags,
} from "@/store/blackbox";
import { BlackboxField } from "@/store/constants";
import { useInfoStore } from "@/store/info";
import { useProfileStore } from "@/store/profile";
import { useStateStore } from "@/store/state";
import { $enum } from "ts-enum-util";
import { defineComponent } from "vue";

export default defineComponent({
  name: "blackbox",
  setup() {
    return {
      blackbox: useBlackboxStore(),
      profile: useProfileStore(),
      state: useStateStore(),
      info: useInfoStore(),
    };
  },
  data() {
    return {
      current_preset: -1,
    };
  },
  computed: {
    usedSize() {
      return (this.blackbox?.list?.files || []).reduce((p, c) => p + c.size, 0);
    },
    blackboxRate() {
      return (
        (
          1e6 /
          this.state.looptime_autodetect /
          this.profile.blackbox.rate_divisor
        ).toString() + " Hz"
      );
    },
    blackboxFields() {
      const fieldflags = transformBlackboxFieldFlags(
        this.profile.blackbox.blackbox_fieldflags
      );
      const fields = $enum(BlackboxField)
        .getEntries()
        .map((key, val) => {
          return {
            val: val,
            title: BlackboxFields[val].title,
            active: (fieldflags & (1 << val)) > 0,
          };
        });
      if (fields.every((p) => p.active)) {
        return ["All"];
      }
      return fields.filter((p) => p.active).map((p) => p.title);
    },
    blackboxPresets() {
      return [
        { value: -1, text: "Choose..." },
        ...this.blackbox.presets.map((p, i) => {
          return {
            value: i,
            text: p.name,
          };
        }),
      ];
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
    load_preset(i: number) {
      this.profile.blackbox.blackbox_fieldflags =
        this.blackbox.presets[i].blackbox_fieldflags;
      this.profile.blackbox.rate_divisor =
        this.blackbox.presets[i].rate_divisor;
      this.current_preset = -1;
    },
  },
  created() {
    this.blackbox.list_blackbox();
    if (this.info.quicVersionGt("0.1.2")) {
      this.blackbox.fetch_presets();
    }
  },
});
</script>

<style lang="scss">
.blackbox-progress {
  width: 50%;
  margin: 10px;
}
</style>
