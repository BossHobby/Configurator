<template>
  <div class="columns">
    <form class="column is-12" @submit="onSubmit">
      <div class="card">
        <div class="card-header">
          <p class="card-header-title">
            Flash
            <tooltip entry="flash.reset" />
          </p>
          <spinner-btn
            class="card-header-button is-info"
            type="button"
            @click="serial.hard_reboot()"
          >
            Reset to Bootloader
          </spinner-btn>
        </div>
        <div class="card-content field-is-3">
          <div class="field is-horizontal">
            <div class="field-label is-normal">
              <label class="label">
                Source <tooltip entry="flash.source" />
              </label>
            </div>
            <div class="field-body">
              <div class="field is-narrow">
                <div class="control">
                  <div class="select is-fullwidth">
                    <input-select v-model="source" :options="sourceOptions">
                    </input-select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="field is-horizontal" v-if="source == 'local'">
            <div class="field-label is-medium">
              <label class="label">
                File
                <tooltip entry="flash.file-local" />
              </label>
            </div>
            <div class="field-body">
              <div class="field">
                <div
                  class="file is-boxed is-medium"
                  :class="{ 'has-name': file }"
                >
                  <label class="file-label">
                    <input
                      class="file-input"
                      type="file"
                      @change="updateFile()"
                      ref="file"
                      accept=".hex"
                    />
                    <span class="file-cta">
                      <span class="file-icon">
                        <font-awesome-icon icon="fa-solid fa-upload" />
                      </span>
                      <span class="file-label"> Choose a file… </span>
                    </span>
                    <span v-if="file" class="file-name">
                      {{ file.name }}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="field is-horizontal" v-if="source != 'local'">
            <div class="field-label is-normal">
              <label class="label">
                Release
                <tooltip entry="flash.file-release" />
              </label>
            </div>
            <div class="field-body">
              <div class="field is-narrow">
                <div class="control">
                  <div class="select is-fullwidth">
                    <input-select v-model="release" :options="releaseOptions" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="field is-horizontal" v-if="source != 'local'">
            <div class="field-label is-normal">
              <label class="label">
                Target
                <tooltip entry="flash.file-remote" />
              </label>
            </div>
            <div class="field-body">
              <div class="field is-narrow">
                <div class="control">
                  <div class="select is-fullwidth">
                    <input-select v-model="target" :options="targetOptions" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-for="(v, k) in progress" :key="k" class="columns my-2 mx-2">
            <div class="column is-2">{{ k }}</div>
            <div class="column is-10">
              <progress
                class="progress is-primary"
                height="20px"
                :value="v.current"
                :max="v.total"
              ></progress>
            </div>
          </div>
        </div>
        <footer class="card-footer">
          <spinner-btn
            class="card-footer-item"
            :disabled="!canFlash"
            type="submit"
          >
            Flash
          </spinner-btn>
        </footer>
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Flasher } from "@/store/flash/flash";
import { github } from "@/store/util/github";
import { Log } from "@/log";
import SpinnerBtn from "@/components/SpinnerBtn.vue";
import { useFlashStore } from "@/store/flash";
import { useSerialStore } from "@/store/serial";
import { useRootStore } from "@/store/root";

export default defineComponent({
  name: "Flash",
  components: { SpinnerBtn },
  setup() {
    return {
      flash: useFlashStore(),
      serial: useSerialStore(),
      root: useRootStore(),
    };
  },
  data() {
    return {
      loading: false,
      sourceOptions: [
        { value: "bosshobby", text: "BossHobby/QUICKSILVER" },
        { value: "local", text: "Local" },
      ],
      source: "bosshobby",
      release: undefined as string | undefined,
      target: undefined,
      file: undefined as File | undefined,
      progress: {},
    };
  },
  computed: {
    releaseOptions() {
      return Object.keys(this.flash.firmware_releases);
    },
    targetOptions() {
      if (!this.release) {
        return [];
      }

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
    updateFile() {
      const fileInput = this.$refs.file as HTMLInputElement;
      if (fileInput.files && fileInput.files.length) {
        this.file = fileInput.files[0];
      } else {
        this.file = undefined;
      }
    },
    onSubmit(evt) {
      evt.preventDefault();

      let promise = undefined as Promise<string> | undefined;
      if (this.source == "local") {
        promise = new Promise((resolve, reject) => {
          if (!this.file) {
            return reject();
          }

          const reader = new FileReader();
          reader.addEventListener("load", (event) => {
            if (event?.target?.result) {
              resolve(event.target.result as string);
            } else {
              reject();
            }
          });
          reader.readAsText(this.file);
        });
      } else if (this.target) {
        promise = github.fetchAsset(this.target).then((res) => res.text());
      }

      if (!promise) {
        return;
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
          this.root.append_alert({
            type: "success",
            msg: "Firmware flashed!",
          })
        )
        .catch((err) => {
          Log.error("Flash", err);

          this.root.append_alert({
            type: "danger",
            msg: "Flash failed!",
          });
        })
        .then(() => (this.loading = false))
        .then(() => (this.progress = {}));
    },
  },
  created() {
    this.flash.fetch_firmware_releases().then(() => {
      this.release = this.releaseOptions.find((v) => !v.endsWith("-dev"));
    });
  },
});
</script>
