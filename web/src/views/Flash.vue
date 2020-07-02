<template>
  <b-container>
    <b-row>
      <b-col sm="12">
        <b-card>
          <h5 slot="header" class="mb-0">
            Flash
            <b-button
              size="sm"
              class="my-2 mx-2"
              @click="hard_reboot_first_port()"
              :disabled="status.AvailablePorts.length == 0 || status.HasDFU"
            >Reset to Bootloader</b-button>
          </h5>
          <b-row v-if="!status.HasDFU">
            <b-col sm="6">
              <h4>No DFU detected</h4>
              <b-button class="my-2" type="button" @click="connect_flash()">Scan</b-button>
            </b-col>
          </b-row>
          <b-row v-else>
            <b-col sm="8">
              <b-form @submit="onSubmit">
                <b-form-group label="Source" label-for="source" label-cols-sm="2">
                  <b-form-select id="source" v-model="source" :options="sourceOptions"></b-form-select>
                </b-form-group>

                <b-form-group
                  v-if="source == 'local'"
                  label="File"
                  label-for="file-local"
                  label-cols-sm="2"
                >
                  <b-form-file id="file-local" v-model="file" accept=".hex"></b-form-file>
                </b-form-group>

                <b-form-group
                  v-if="source != 'local'"
                  label="Release"
                  label-for="file-release"
                  label-cols-sm="2"
                >
                  <b-form-select id="file-release" v-model="release" :options="releaseOptions"></b-form-select>
                </b-form-group>

                <b-form-group
                  v-if="source != 'local'"
                  label="Target"
                  label-for="file-remote"
                  label-cols-sm="2"
                >
                  <b-form-select id="file-remote" v-model="target" :options="targetOptions"></b-form-select>
                </b-form-group>

                <b-row v-for="(v, k) in progress" :key="k" class="my-2 mx-2">
                  <b-col sm="2">{{k}}</b-col>
                  <b-col sm="10">
                    <b-progress
                      height="20px"
                      :value="v.Current"
                      :max="v.Total"
                      show-progress
                      animated
                    ></b-progress>
                  </b-col>
                </b-row>

                <b-button class="my-2" :disabled="!canFlash" type="submit">Flash</b-button>
              </b-form>
            </b-col>
          </b-row>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { post, upload } from "@/store/api.js";
import { mapActions, mapState } from "vuex";

export default {
  name: "flash",
  data() {
    return {
      loading: false,
      sourceOptions: [
        { value: "guano", text: "Guano" },
        { value: "local", text: "Local" }
      ],
      source: "guano",
      release: "latest",
      target: null,
      file: null,
      progress: {}
    };
  },
  watch: {
    flash(val) {
      const u = { ...this.progress };
      u[val.Task] = val;
      this.progress = u;
    }
  },
  computed: {
    ...mapState(["status", "firmware_releases", "flash"]),
    releaseOptions() {
      return Object.keys(this.firmware_releases).reverse();
    },
    targetOptions() {
      const release = this.firmware_releases[this.release];
      if (!release) {
        return [];
      }
      return release.map(r => {
        return { value: r, text: r.Name.replace("quicksilver.", "") };
      });
    },
    canFlash() {
      if (this.loading) {
        return false;
      }
      if (this.source == "local") {
        return !!this.file;
      }
      return !!this.target;
    }
  },
  methods: {
    ...mapActions([
      "hard_reboot_first_port",
      "fetch_firmware_releases",
      "connect_flash"
    ]),
    onSubmit(evt) {
      evt.preventDefault();

      var promise = null;
      if (this.source == "local") {
        const formData = new FormData();
        formData.append("file", this.file);
        promise = upload("/api/flash/local", formData);
      } else if (this.target) {
        promise = post("/api/flash/remote", this.target);
      }

      if (promise) {
        this.loading = true;
        return promise
          .then(() => this.$store.commit("append_alert", "firmware flashed!"))
          .then(() => (this.loading = false))
          .then(() => (this.progress = {}));
      }
    }
  },
  created() {
    this.fetch_firmware_releases().then(
      () => (this.release = this.releaseOptions[0])
    );
  }
};
</script>
