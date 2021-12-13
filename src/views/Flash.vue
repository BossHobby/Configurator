<template>
  <b-container>
    <b-row>
      <b-col sm="12">
        <b-card>
          <h5 slot="header" class="mb-0">
            Flash
            <b-button size="sm" class="my-2 mx-2" @click="hard_reboot()"
              >Reset to Bootloader</b-button
            >
          </h5>
          <b-row>
            <b-col sm="8">
              <b-form @submit="onSubmit">
                <b-form-group
                  label="Source"
                  label-for="source"
                  label-cols-sm="2"
                >
                  <b-form-select
                    id="source"
                    v-model="source"
                    :options="sourceOptions"
                  ></b-form-select>
                </b-form-group>

                <b-form-group
                  v-if="source == 'local'"
                  label="File"
                  label-for="file-local"
                  label-cols-sm="2"
                >
                  <b-form-file
                    id="file-local"
                    v-model="file"
                    accept=".hex"
                  ></b-form-file>
                </b-form-group>

                <b-form-group
                  v-if="source != 'local'"
                  label="Release"
                  label-for="file-release"
                  label-cols-sm="2"
                >
                  <b-form-select
                    id="file-release"
                    v-model="release"
                    :options="releaseOptions"
                  ></b-form-select>
                </b-form-group>

                <b-form-group
                  v-if="source != 'local'"
                  label="Target"
                  label-for="file-remote"
                  label-cols-sm="2"
                >
                  <b-form-select
                    id="file-remote"
                    v-model="target"
                    :options="targetOptions"
                  ></b-form-select>
                </b-form-group>

                <b-row v-for="(v, k) in progress" :key="k" class="my-2 mx-2">
                  <b-col sm="2">{{ k }}</b-col>
                  <b-col sm="10">
                    <b-progress
                      height="20px"
                      :value="v.current"
                      :max="v.total"
                      show-progress
                      animated
                    ></b-progress>
                  </b-col>
                </b-row>

                <b-button class="my-2" :disabled="!canFlash" type="submit"
                  >Flash</b-button
                >
              </b-form>
            </b-col>
          </b-row>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { mapActions, mapState } from "vuex";
import { Flasher } from "@/store/flash/flash";
import { github } from "@/store/flash/github";
import { Log } from "@/log";

export default {
  name: "flash",
  data() {
    return {
      loading: false,
      sourceOptions: [
        { value: "bosshobby", text: "BossHobby/QUICKSILVER" },
        { value: "local", text: "Local" },
      ],
      source: "bosshobby",
      release: null,
      target: null,
      file: null,
      progress: {},
    };
  },
  computed: {
    ...mapState(["flash"]),
    releaseOptions() {
      return Object.keys(this.flash.firmware_releases);
    },
    targetOptions() {
      const release = this.flash.firmware_releases[this.release];
      if (!release) {
        return [];
      }
      return release.map((r) => {
        return { value: r, text: r.name.replace("quicksilver.", "") };
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
    },
  },
  methods: {
    ...mapActions(["hard_reboot", "fetch_firmware_releases"]),
    onSubmit(evt) {
      evt.preventDefault();

      var promise = null;
      if (this.source == "local") {
        promise = new Promise((resolve) => {
          const reader = new FileReader();
          reader.addEventListener("load", (event) => {
            resolve(event.target.result);
          });
          reader.readAsText(this.file);
        });
      } else if (this.target) {
        promise = github.fetchAsset(this.target).then((res) => res.text());
      }

      const flasher = new Flasher();

      flasher.onProgress((p) => {
        const u = { ...this.progress };
        u[p.task] = p;
        this.progress = u;
      });

      return promise
        .then((hex) => flasher.flash(hex))
        .then(() =>
          this.$store.commit("append_alert", {
            type: "success",
            msg: "Firmware flashed!",
          })
        )
        .catch((err) => {
          Log.error("Flash", err);

          this.$store.commit("append_alert", {
            type: "danger",
            msg: "Flash failed!",
          });
        })
        .then(() => (this.loading = false))
        .then(() => (this.progress = {}));
    },
  },
  created() {
    this.fetch_firmware_releases().then(() => {
      this.release = this.releaseOptions[0];
    });
  },
};
</script>
