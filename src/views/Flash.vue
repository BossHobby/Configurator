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
            @click="resetToBootloader()"
          >
            Reset to Bootloader
          </spinner-btn>
        </div>

        <div class="card-content field-is-3">
          <div v-if="currentTarget" class="field is-horizontal">
            <div class="field-label is-normal">
              <label class="label"> Current Target </label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control is-expanded">
                  <input
                    class="input is-static"
                    :value="currentTarget"
                    readonly
                  />
                </div>
              </div>
            </div>
          </div>

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
                    <input-select
                      v-model="source"
                      :options="sourceOptions"
                      :disabled="loading"
                    >
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
                      :disabled="loading"
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

          <div class="field is-horizontal" v-if="source == 'branch'">
            <div class="field-label is-normal">
              <label class="label">
                Branch
                <tooltip entry="flash.file-branch" />
              </label>
            </div>
            <div class="field-body">
              <div class="field is-narrow">
                <div class="control">
                  <div class="select is-fullwidth">
                    <input-select
                      v-model="branch"
                      :options="branchOptions"
                      :disabled="loading"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="field is-horizontal" v-if="source == 'pull_request'">
            <div class="field-label is-normal">
              <label class="label">
                Pull Request
                <tooltip entry="flash.file-pull-request" />
              </label>
            </div>
            <div class="field-body">
              <div class="field is-narrow">
                <div class="control">
                  <div class="select is-fullwidth">
                    <input-select
                      v-model="pullRequest"
                      :options="pullRequestOptions"
                      :disabled="loading"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="field is-horizontal"
            v-if="source == 'branch' || source == 'pull_request'"
          >
            <div class="field-label is-normal">
              <label class="label">
                Commit
                <tooltip entry="flash.file-commit" />
              </label>
            </div>
            <div class="field-body">
              <div class="field is-narrow">
                <div class="control">
                  <input
                    class="input is-fullwidth is-static"
                    type="text"
                    :value="commitHash"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="field is-horizontal" v-if="source == 'release'">
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
                    <input-select
                      v-model="release"
                      :options="releaseOptions"
                      :disabled="loading"
                    />
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
                    <div
                      class="dropdown"
                      :class="{ 'is-active': dropdownActive || dropdownHover }"
                    >
                      <div class="dropdown-trigger">
                        <div class="field">
                          <p class="control is-expanded has-icons-right">
                            <input
                              class="input is-fullwidth"
                              type="search"
                              placeholder="Search..."
                              v-model="targetSearch"
                              @focus="dropdownActive = true"
                              @blur="dropdownActive = false"
                              :disabled="loading"
                            />
                          </p>
                        </div>
                      </div>
                      <div
                        class="dropdown-menu"
                        style="overflow-y: auto; max-height: 50vh"
                        role="menu"
                        @mouseover="dropdownHover = true"
                        @mouseleave="dropdownHover = false"
                      >
                        <div class="dropdown-content">
                          <a
                            v-for="o of targetOptions"
                            :key="o.value"
                            :value="o.value"
                            class="dropdown-item"
                            :class="{ 'is-active': target == o }"
                            @click.prevent="selectTarget(o)"
                          >
                            {{ o.text }}
                          </a>
                        </div>
                      </div>
                    </div>
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
            :class="{ 'is-loading': loading }"
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
import { Flasher, type FlashProgress } from "@/store/flash/flash";
import { github } from "@/store/util/github";
import { Log } from "@/log";
import { useFlashStore } from "@/store/flash";
import { useSerialStore } from "@/store/serial";
import { useRootStore } from "@/store/root";
import * as semver from "semver";
import { ConfigOffsets, IntelHEX } from "@/store/flash/ihex";
import Fuse from "fuse.js";

export default defineComponent({
  name: "Flash",
  setup() {
    return {
      root: useRootStore(),
      flash: useFlashStore(),
      serial: useSerialStore(),
    };
  },
  data() {
    return {
      loading: true,
      dropdownHover: false,
      dropdownActive: false,
      sourceOptions: [
        { value: "release", text: "Release" },
        { value: "branch", text: "Development Branch" },
        { value: "pull_request", text: "Pull Request" },
        { value: "local", text: "Local" },
      ],
      progress: [] as any[],
      source: "",
      release: undefined as string | undefined,
      branch: undefined as string | undefined,
      pullRequest: undefined as string | undefined,
      targetSearch: "",
      currentTarget: undefined as string | undefined,
      target: undefined as any | undefined,
      file: undefined as File | undefined,
    };
  },
  watch: {
    async source() {
      this.loading = true;
      await this.flash.fetch(this.source);
      this.loading = false;

      this.release = this.pickRelease();
      this.branch = this.branchOptions[0];
      this.pullRequest = this.pullRequestOptions[0];

      this.targetSearch = "";
      this.target = undefined;
      this.file = undefined;
    },
    release() {
      this.targetSearch = "";
      this.target = undefined;
      this.file = undefined;
    },
    branch() {
      this.targetSearch = "";
      this.target = undefined;
      this.file = undefined;
    },
    pullRequest() {
      this.targetSearch = "";
      this.target = undefined;
      this.file = undefined;
    },
  },
  computed: {
    branchOptions() {
      return Object.keys(this.flash.branches);
    },
    pullRequestOptions() {
      return Object.keys(this.flash.pullRequests);
    },
    releaseOptions() {
      return Object.keys(this.flash.releases);
    },
    commitHash() {
      const source =
        this.source == "branch"
          ? this.flash.branches[this.branch || ""]
          : this.flash.pullRequests[this.pullRequest || ""];
      if (!source) {
        return "";
      }
      return source.commit.slice(0, 8);
    },
    isRuntimeTarget() {
      if (this.source == "release" && this.release) {
        return semver.satisfies(this.release, ">=0.10.0-dev", {
          includePrerelease: true,
        });
      }
      if (this.source == "branch" && this.branch) {
        const branch = this.flash.branches[this.branch];
        return semver.satisfies(branch.version, ">=0.10.0-dev", {
          includePrerelease: true,
        });
      }
      if (this.source == "pull_request" && this.pullRequest) {
        const pullRequest = this.flash.pullRequests[this.pullRequest];
        return semver.satisfies(pullRequest.version, ">=0.10.0-dev", {
          includePrerelease: true,
        });
      }
      return false;
    },
    targetOptions() {
      let options = [] as any[];
      if (this.isRuntimeTarget) {
        options = this.flash.targets.map((r) => {
          const mgfr = this.flash.manufacturers[r.manufacturer || "CUST"];
          return { value: r, text: `${mgfr.name} / ${r.name}` };
        });
      } else {
        let targets = [] as any[];
        if (this.source == "release" && this.release) {
          targets = this.flash.releases[this.release] || [];
        } else if (this.source == "branch" && this.branch) {
          targets = this.flash.branches[this.branch].artifacts || [];
        } else if (this.source == "pull_request" && this.pullRequest) {
          targets = this.flash.pullRequests[this.pullRequest].artifacts || [];
        }

        options = targets.map((r) => {
          return { value: r, text: r.name.replace("quicksilver.", "") };
        });
      }

      if (this.targetSearch.length == 0) {
        return options;
      }

      const fuse = new Fuse(options, {
        includeScore: false,
        keys: ["text"],
      });
      return fuse.search(this.targetSearch).map((r) => r.item);
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
    async resetToBootloader() {
      this.currentTarget = await this.serial.hard_reboot();
    },
    pickRelease() {
      return this.releaseOptions.find(
        (v) => !v.endsWith("-dev") && !v.includes("-rc"),
      );
    },
    selectTarget(target: any) {
      this.target = target.value;
      this.targetSearch = target.text;
      this.dropdownHover = false;
      this.dropdownActive = false;
    },
    updateFile() {
      const fileInput = this.$refs.file as HTMLInputElement;
      if (fileInput.files && fileInput.files.length) {
        this.file = fileInput.files[0];
      } else {
        this.file = undefined;
      }
    },
    fetchFirmware(): Promise<string | undefined> {
      switch (this.source) {
        case "local":
          return new Promise((resolve, reject) => {
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

        case "release":
          if (this.isRuntimeTarget && this.release) {
            const release = this.flash.releases[this.release];
            const asset = release
              .sort((a, b) => a.name.length - b.name.length)
              .find((a) => a.name.includes(this.target?.mcu));
            return github.fetchAsset(asset).then((res) => res.text());
          }
          return github.fetchAsset(this.target).then((res) => res.text());

        case "branch":
          if (this.isRuntimeTarget && this.branch) {
            const branch = this.flash.branches[this.branch];
            const artifact = branch.artifacts
              .sort((a, b) => a.name.length - b.name.length)
              .find((a) => a.name.includes(this.target?.mcu));
            return github.fetchArtifact(artifact);
          }
          return github.fetchArtifact(this.target);

        case "pull_request":
          if (this.isRuntimeTarget && this.pullRequest) {
            const pullRequest = this.flash.pullRequests[this.pullRequest];
            const artifact = pullRequest.artifacts
              .sort((a, b) => a.name.length - b.name.length)
              .find((a) => a.name.includes(this.target?.mcu));
            return github.fetchArtifact(artifact);
          }
          return github.fetchArtifact(this.target);

        default:
          return Promise.resolve(undefined);
      }
    },
    updateProgress(p: FlashProgress) {
      const u = { ...this.progress };
      u[p.task] = p;
      this.progress = u;
    },
    onSubmit(evt) {
      evt.preventDefault();

      this.loading = true;

      const flasher = new Flasher();
      flasher.onProgress((p) => this.updateProgress(p));

      return flasher
        .connect()
        .then(() => {
          this.updateProgress({
            task: "download",
            current: 10,
            total: 100,
          });
          return this.fetchFirmware();
        })
        .then(async (hexStr) => {
          if (!hexStr) {
            throw new Error("firmware not found");
          }
          this.updateProgress({
            task: "download",
            current: 90,
            total: 100,
          });

          const hex = IntelHEX.parse(hexStr);
          if (this.isRuntimeTarget) {
            const target = await this.flash.fetchRuntimeConfig(
              this.target.target,
            );
            Log.info("Flash", "injecting target ", this.target.target);
            hex.patch(ConfigOffsets[this.target.mcu], target);
          }

          this.updateProgress({
            task: "download",
            current: 100,
            total: 100,
          });

          return flasher.flash(hex);
        })
        .then(() =>
          this.root.append_alert({
            type: "success",
            msg: "Firmware flashed!",
          }),
        )
        .catch((err) => {
          Log.error("Flash", err);

          this.root.append_alert({
            type: "danger",
            msg: "Flash failed!",
          });
        })
        .finally(() => {
          this.progress = [];
          this.loading = false;
        });
    },
  },
  async created() {
    this.source = "release";
  },
});
</script>
