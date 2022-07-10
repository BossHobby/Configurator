<template>
  <div class="columns">
    <form class="column is-12" @submit="onSubmit">
      <div class="card">
        <div class="card-header">
          <p class="card-header-title">
            Flash
            <button class="button is-small my-2 mx-2" @click="hard_reboot()">
              Reset to Bootloader
            </button>
            <tooltip entry="flash.reset" />
          </p>
        </div>
        <div class="card-content">
          <div class="field is-horizontal">
            <div class="field-label is-normal">
              <label class="label"> Source <tooltip entry="flash.source" /> </label>
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

          <b-form-group v-if="source == 'local'" label-for="file-local" label-cols-sm="2">
            <span slot="label">
              File
              <tooltip entry="flash.file-local" />
            </span>
            <b-form-file id="file-local" v-model="file" accept=".hex"></b-form-file>
          </b-form-group>

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

          <div v-for="(v, k) in progress" :key="k" class="my-2 mx-2">
            <div class="column is-2">{{ k }}</div>
            <div class="column is-10">
              <b-progress
                height="20px"
                :value="v.current"
                :max="v.total"
                show-progress
                animated
              ></b-progress>
            </div>
          </div>
        </div>
        <footer class="card-footer">
          <spinner-btn
            class="card-footer-item button"
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
import { mapActions, mapState } from "vuex";
import { Flasher } from "@/store/flash/flash";
import { github } from "@/store/util/github";
import { Log } from "@/log";
import SpinnerBtn from "@/components/SpinnerBtn.vue";

export default defineComponent({
  components: { SpinnerBtn },
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
      this.release = this.releaseOptions.find((v) => !v.endsWith("-dev"));
    });
  },
});
</script>
