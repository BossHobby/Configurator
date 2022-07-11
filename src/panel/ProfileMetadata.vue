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
            <input class="input" type="text" v-model="meta.name" />
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
            <label class="label">Gyro ID</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  class="input is-static"
                  :value="'0x' + info.gyro_id.toString(16)"
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
        :disabled="is_read_only"
      >
        Load Profile
      </spinner-btn>
      <spinner-btn class="card-footer-item is-warning" @click="reset_profile">
        Reset Profile
      </spinner-btn>
    </footer>
    <input accept=".json, .yaml" type="file" ref="file" style="display: none" />
    <a ref="downloadAnchor" target="_blank"></a>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapState, mapActions, mapGetters } from "vuex";
import YAML from "yaml";
import { $enum } from "ts-enum-util";
import { serial } from "../store/serial/serial";
import { mapFields } from "@/store/helper.js";
import { QuicVal } from "@/store/serial/quic";
import { timeAgo } from "@/mixin/filters";

export default defineComponent({
  name: "ProlfileMetadata",
  data() {
    return {};
  },
  computed: {
    ...mapFields("profile", ["meta"]),
    ...mapState(["info", "state", "serial"]),
    ...mapGetters(["is_read_only"]),
    ...mapState("constants", ["Features"]),
    date() {
      return new Date(this.meta.datetime * 1000);
    },
    features() {
      return $enum(this.Features)
        .getKeys()
        .filter((f, i) => {
          return this.info.features & (1 << (i + 1));
        })
        .join(", ");
    },
  },
  methods: {
    timeAgo,
    ...mapActions(["apply_profile", "reset_profile"]),
    uploadProfile() {
      const reader = new FileReader();
      reader.addEventListener("load", (event) => {
        const profile = YAML.parse(event.target.result);
        this.apply_profile(profile);
      });

      this.$refs.file.oninput = () => {
        if (!this.$refs.file.files.length) {
          return;
        }
        reader.readAsText(this.$refs.file.files[0]);
      };

      this.$refs.file.click();
    },
    downloadProfile() {
      return serial.get(QuicVal.Profile).then((profile) => {
        const encoded = encodeURIComponent(YAML.stringify(profile));
        const yaml = "data:text/yaml;charset=utf-8," + encoded;

        const date = this.date.toISOString().substring(0, 10);
        const name = profile.meta.name.replace(/\0/g, "");
        const filename = `Profile_${name}_${date}.yaml`;

        this.$refs.downloadAnchor.setAttribute("href", yaml);
        this.$refs.downloadAnchor.setAttribute("download", filename);
        this.$refs.downloadAnchor.click();
      });
    },
  },
});
</script>

<style scoped></style>
