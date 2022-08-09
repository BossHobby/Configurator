<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Metadata</p>
    </header>
    <div class="card-content">
      <div class="content column-narrow field-is-2">
        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label" for="name">Profile Name</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded"></div>
            </div>
            <input class="input" type="text" v-model="profile.meta.name" />
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">Profile Last Modified</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input class="input is-static" :value="timeAgo(date)" readonly />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">Target Name</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input class="input is-static" :value="info.target_name" readonly />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal" v-if="info.features != null">
          <div class="field-label">
            <label class="label">Features</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input class="input is-static" :value="features" readonly />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal" v-if="info.gyro_id != null">
          <div class="field-label">
            <label class="label">Gyro Type</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  class="input is-static"
                  :value="gyroNames[info.gyro_id]"
                  readonly
                />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">Version</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input class="input is-static" :value="info.git_version" readonly />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <footer class="card-footer">
      <spinner-btn class="card-footer-item" @click="downloadProfile">
        Save Profile
      </spinner-btn>
      <spinner-btn
        class="card-footer-item"
        @click="uploadProfile"
        :disabled="info.is_read_only"
      >
        Load Profile
      </spinner-btn>
      <spinner-btn class="card-footer-item is-warning" @click="profile.reset">
        Reset Profile
      </spinner-btn>
    </footer>
    <input accept=".json, .yaml" type="file" ref="file" style="display: none" />
    <a ref="downloadAnchor" target="_blank"></a>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import YAML from "yaml";
import { $enum } from "ts-enum-util";
import { serial } from "../store/serial/serial";
import { QuicVal } from "@/store/serial/quic";
import { timeAgo } from "@/mixin/filters";
import { useInfoStore } from "@/store/info";
import { useStateStore } from "@/store/state";
import { useProfileStore } from "@/store/profile";
import { useSerialStore } from "@/store/serial";
import { useConstantStore } from "@/store/constants";

export default defineComponent({
  name: "ProlfileMetadata",
  setup() {
    const constants = useConstantStore();

    return {
      info: useInfoStore(),
      state: useStateStore(),
      profile: useProfileStore(),
      serial: useSerialStore(),

      Features: computed(() => constants.Features),
      GyroType: computed(() => constants.GyroType),
    };
  },
  computed: {
    date() {
      return new Date(this.profile.meta.datetime * 1000);
    },
    features() {
      return $enum(this.Features)
        .getKeys()
        .filter((f, i) => {
          return this.info.features & (1 << (i + 1));
        })
        .join(", ");
    },
    gyroNames() {
      return $enum(this.GyroType).getKeys();
    },
    fileRef(): HTMLInputElement {
      return this.$refs.file as HTMLInputElement;
    },
    downloadAnchorRef(): HTMLAnchorElement {
      return this.$refs.downloadAnchor as HTMLAnchorElement;
    },
  },
  methods: {
    timeAgo,
    uploadProfile() {
      const reader = new FileReader();
      reader.addEventListener("load", (event) => {
        if (event?.target?.result) {
          const profile = YAML.parse(event?.target?.result as string);
          this.profile.apply_profile(profile);
        }
      });

      this.fileRef.oninput = () => {
        if (!this.fileRef?.files?.length) {
          return;
        }
        reader.readAsText(this.fileRef.files[0]);
      };

      this.fileRef.click();
    },
    downloadProfile() {
      return serial.get(QuicVal.Profile).then((profile) => {
        const encoded = encodeURIComponent(YAML.stringify(profile));
        const yaml = "data:text/yaml;charset=utf-8," + encoded;

        const date = this.date.toISOString().substring(0, 10);
        const name = profile.meta.name.replace(/\0/g, "");
        const filename = `Profile_${name}_${date}.yaml`;

        this.downloadAnchorRef.setAttribute("href", yaml);
        this.downloadAnchorRef.setAttribute("download", filename);
        this.downloadAnchorRef.click();
      });
    },
  },
});
</script>

<style scoped></style>
