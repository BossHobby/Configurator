<template>
  <b-card>
    <h5 slot="header" class="mb-0">Metadata</h5>

    <b-row>
      <b-col sm="4" class="my-2">
        <label for="name">Profile Name</label>
      </b-col>
      <b-col sm="8" class="my-2">
        <b-form-input id="name" type="text" v-model="meta.name"></b-form-input>
      </b-col>
    </b-row>
    <b-row>
      <b-col sm="4" class="my-2">
        <label>Profile Last Modified</label>
      </b-col>
      <b-col sm="8" class="my-2">{{ date | moment("from") }}</b-col>
    </b-row>
    <b-row>
      <b-col sm="4" class="my-2">
        <label>Target Name</label>
      </b-col>
      <b-col sm="8" class="my-2">{{ info.target_name }}</b-col>
    </b-row>
    <b-row v-if="info.features != null">
      <b-col sm="4" class="my-2">
        <label>Features</label>
      </b-col>
      <b-col sm="8" class="my-2">{{ features }}</b-col>
    </b-row>

    <b-row v-if="info.gyro_id != null">
      <b-col sm="4" class="my-2">
        <label>Gyro ID</label>
      </b-col>
      <b-col sm="8" class="my-2">0x{{ info.gyro_id.toString(16) }}</b-col>
    </b-row>
    <b-row>
      <b-col sm="4" class="my-2">
        <label>Version</label>
      </b-col>
      <b-col sm="8" class="my-2">{{ info.git_version }}</b-col>
    </b-row>
    <b-row>
      <b-col sm="6">
        <b-button class="my-2" @click="downloadProfile">Save Profile</b-button>
      </b-col>
    </b-row>
    <b-row>
      <b-col sm="6">
        <form ref="form">
          <input
            accept=".json, .yaml"
            type="file"
            ref="file"
            style="display: none"
          />
          <b-button
            class="my-2"
            @click="uploadProfile"
            :disabled="is_read_only"
          >
            Load Profile
          </b-button>
        </form>
      </b-col>
    </b-row>
    <b-row>
      <b-col sm="6">
        <b-button class="my-2" @click="reset_profile" variant="warning">
          Reset Profile
        </b-button>
      </b-col>
    </b-row>
    <a ref="downloadAnchor" target="_blank"></a>
  </b-card>
</template>

<script>
import { mapState, mapActions, mapGetters } from "vuex";
import YAML from "yaml";
import { $enum } from "ts-enum-util";
import { serial } from "../store/serial/serial";
import { mapFields } from "@/store/helper.js";
import { QuicVal } from "@/store/serial/quic";

export default {
  name: "Metadata",
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
};
</script>

<style scoped></style>
