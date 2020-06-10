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
        <label for="datetime">Profile Last Modified</label>
      </b-col>
      <b-col sm="8" class="my-2">{{ date | moment("from") }}</b-col>
    </b-row>
    <b-row>
      <b-col sm="4" class="my-2">
        <label for="datetime">Target Name</label>
      </b-col>
      <b-col sm="8" class="my-2">{{ status.Info.target_name }}</b-col>
    </b-row>
    <b-row>
      <b-col sm="4" class="my-2">
        <label for="datetime">Features</label>
      </b-col>
      <b-col sm="8" class="my-2">{{ features }}</b-col>
    </b-row>
    <b-row>
      <b-col sm="4" class="my-2">
        <label for="datetime">RX Protocol</label>
      </b-col>
      <b-col sm="8" class="my-2">{{ rxProtocols[status.Info.rx_protocol] }}</b-col>
    </b-row>
    <b-row>
      <b-col sm="4" class="my-2">
        <label for="datetime">Version</label>
      </b-col>
      <b-col sm="8" class="my-2">{{ status.Info.git_version }}</b-col>
    </b-row>
    <b-row>
      <b-col sm="6">
        <b-button
          class="my-2"
          href="http://localhost:8000/api/profile/download"
          :hidden="!status.IsConnected"
        >Save Profile</b-button>
      </b-col>
    </b-row>
    <b-row>
      <b-col sm="6">
        <form :hidden="!status.IsConnected" ref="form">
          <input accept=".json, .cbor" type="file" ref="file" style="display: none" />
          <b-button class="my-2" @click="uploadProfile">Load Profile</b-button>
        </form>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import { mapState } from "vuex";
import { mapFields } from "@/store/helper.js";

export default {
  name: "Metadata",
  data() {
    return {
      rxProtocols: [
        "INVALID",
        "UNIFIED_SERIAL",
        "SBUS",
        "CRSF",
        "IBUS",
        "FPORT",
        "DSMX_2048",
        "DSM2_1024",
        "NRF24_BAYANG_TELEMETRY",
        "BAYANG_PROTOCOL_BLE_BEACON",
        "BAYANG_PROTOCOL_TELEMETRY_AUTOBIND",
        "FRSKY_D8",
        "FRSKY_D16",
        "REDPINE"
      ]
    };
  },
  computed: {
    ...mapFields("profile", ["meta"]),
    ...mapState({
      status: state => state.status
    }),
    date() {
      return new Date(this.meta.datetime * 1000);
    },
    features() {
      const feat = ["BRUSHLESS", "OSD", "BLACKBOX"];
      return feat
        .filter((f, i) => {
          return this.status.Info.features & (1 << (i + 1));
        })
        .join(", ");
    }
  },
  methods: {
    uploadProfile() {
      this.$refs.file.oninput = () => {
        if (!this.$refs.file.files.length) {
          return;
        }

        const file = this.$refs.file.files[0];
        const formData = new FormData();
        formData.append("file", file);

        fetch("http://localhost:8000/api/profile/upload", {
          method: "POST",
          body: formData
        })
          .then(res => res.json())
          .then(p => this.$store.commit("set_profile", p))
          .then(() => this.$refs.form.reset())
          .then(() => this.$store.commit("append_alert", "profile uploaded!"));
      };

      this.$refs.file.click();
    }
  }
};
</script>

<style scoped>
</style>
