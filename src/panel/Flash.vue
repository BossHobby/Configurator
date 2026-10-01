<template>
  <form @submit="onSubmit">
    <Panel
      title="Firmware"
      description="Flash a QUICKSILVER release, development build, or local file."
      help="flash.reset"
    >
      <template #actions>
        <spinner-btn type="button" @click="resetToBootloader()"
          >Reset to bootloader</spinner-btn
        >
      </template>
      <div class="form-grid">
        <div v-if="currentTarget" class="form-row">
          <label class="form-label" for="flash-current-target"
            >Current target</label
          >
          <input
            id="flash-current-target"
            class="form-input"
            :value="currentTarget"
            readonly
          />
        </div>

        <div class="form-row">
          <label class="form-label" for="flash-source">
            Source <tooltip entry="flash.source" />
          </label>
          <UiSelect
            id="flash-source"
            v-model="source"
            :options="sourceOptions"
            :disabled="loading"
          />
        </div>

        <div v-if="source == 'local'" class="form-row">
          <span class="form-label">
            File <tooltip entry="flash.file-local" />
          </span>
          <label class="flex min-w-0 items-center gap-3">
            <span class="form-button relative">
              <Icon name="upload" />Choose a file…
              <input
                ref="file"
                class="absolute inset-0 cursor-pointer opacity-0"
                type="file"
                accept=".hex"
                :disabled="loading"
                @change="updateFile()"
              />
            </span>
            <span v-if="file" class="truncate text-sm text-muted">
              {{ file.name }}
            </span>
          </label>
        </div>

        <div v-if="source == 'branch'" class="form-row">
          <label class="form-label" for="flash-branch">
            Branch <tooltip entry="flash.file-branch" />
          </label>
          <UiSelect
            id="flash-branch"
            v-model="branch"
            :options="branchOptions"
            :disabled="loading"
          />
        </div>

        <div v-if="source == 'pull_request'" class="form-row">
          <label class="form-label" for="flash-pull-request">
            Pull request <tooltip entry="flash.file-pull-request" />
          </label>
          <UiSelect
            id="flash-pull-request"
            v-model="pullRequest"
            :options="pullRequestOptions"
            :disabled="loading"
          />
        </div>

        <div
          v-if="source == 'branch' || source == 'pull_request'"
          class="form-row"
        >
          <label class="form-label" for="flash-commit">
            Commit <tooltip entry="flash.file-commit" />
          </label>
          <input
            id="flash-commit"
            class="form-input font-mono"
            type="text"
            :value="commitHash"
            readonly
          />
        </div>

        <div v-if="source == 'release'" class="form-row">
          <label class="form-label" for="flash-release">
            Release <tooltip entry="flash.file-release" />
          </label>
          <UiSelect
            id="flash-release"
            v-model="release"
            :options="releaseOptions"
            :disabled="loading"
          />
        </div>

        <div
          v-if="source != 'local' && isRuntimeTarget && supportsVehicles"
          class="form-row"
        >
          <label class="form-label" for="flash-vehicle">Vehicle</label>
          <UiSelect
            id="flash-vehicle"
            v-model="vehicle"
            :options="vehicleOptions"
            :disabled="loading"
          />
        </div>

        <div v-if="source != 'local'" class="form-row col-span-full">
          <label class="form-label" for="flash-target">
            Target <tooltip entry="flash.file-remote" />
          </label>
          <div class="relative">
            <input
              id="flash-target"
              v-model="targetSearch"
              class="form-input"
              type="search"
              placeholder="Search targets…"
              autocomplete="off"
              :disabled="loading"
              @focus="dropdownActive = true"
              @blur="dropdownActive = false"
            />
            <div
              v-show="dropdownActive || dropdownHover"
              class="absolute top-full right-0 left-0 z-50 mt-1 max-h-[50vh] overflow-y-auto rounded-md border border-line bg-panel py-1 shadow-lg"
              role="listbox"
              @mouseover="dropdownHover = true"
              @mouseleave="dropdownHover = false"
            >
              <a
                v-for="o of targetOptions"
                :key="o.value"
                role="option"
                :aria-selected="target == o"
                class="block w-full cursor-pointer px-3 py-2 text-sm hover:bg-subtle"
                :class="{ 'bg-active font-medium': target == o }"
                @click.prevent="selectTarget(o)"
              >
                {{ o.text }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div v-if="Object.keys(progress).length" class="mt-5 space-y-2">
        <div
          v-for="(v, k) in progress"
          :key="k"
          class="grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-3 text-xs"
        >
          <span class="text-muted capitalize">{{ k }}</span>
          <progress
            class="h-2 w-full overflow-hidden rounded-full"
            :value="v.current"
            :max="v.total"
          ></progress>
        </div>
      </div>

      <div class="mt-5 flex justify-end">
        <!-- Stays a plain button until a firmware is chosen, so it never
             competes with the Connect button above it. -->
        <spinner-btn
          :variant="canFlash ? 'primary' : 'secondary'"
          :aria-busy="loading"
          :disabled="!canFlash"
          type="submit"
          >Flash firmware</spinner-btn
        >
      </div>
    </Panel>
  </form>
</template>

<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
import Icon from "@/components/ui/Icon.vue";
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
  components: { Panel, Icon },
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
      vehicle: "multi",
      targetSearch: "",
      currentTarget: undefined as string | undefined,
      target: undefined as any | undefined,
      file: undefined as File | undefined,
    };
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
    firmwareVersion() {
      if (this.source == "release" && this.release) {
        return this.release;
      }
      if (this.source == "branch" && this.branch) {
        return this.flash.branches[this.branch].version;
      }
      if (this.source == "pull_request" && this.pullRequest) {
        return this.flash.pullRequests[this.pullRequest].version;
      }
      return "v0.0.0";
    },
    supportsVehicles() {
      return semver.satisfies(this.firmwareVersion, ">=0.12.0", {
        includePrerelease: true,
      });
    },
    targetVehicles() {
      const vehicles = new Set<string>();
      for (const target of this.flash.targets) {
        for (const vehicle of target.vehicles || ["multi"]) {
          vehicles.add(vehicle);
        }
      }
      return Array.from(vehicles);
    },
    selectedVehicle() {
      return this.supportsVehicles ? this.vehicle : "multi";
    },
    vehicleOptions() {
      return this.targetVehicles.map((vehicle) => ({
        value: vehicle,
        text: vehicle.charAt(0).toUpperCase() + vehicle.slice(1),
      }));
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
        options = this.flash.targets
          .filter((r) =>
            (r.vehicles || ["multi"]).includes(this.selectedVehicle),
          )
          .map((r) => {
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
    vehicle() {
      this.targetSearch = "";
      this.target = undefined;
      this.file = undefined;
    },
  },
  async created() {
    this.source = "release";
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
    selectRuntimeArtifact(artifacts: any[]) {
      const env = `${this.selectedVehicle}-${this.target?.mcu}`;
      const artifact = artifacts.find((a) => a.name.includes(env));
      if (artifact) {
        return artifact;
      }
      if (this.selectedVehicle == "multi") {
        const legacyArtifact = artifacts.find((a) =>
          a.name.includes(this.target?.mcu),
        );
        if (legacyArtifact) {
          return legacyArtifact;
        }
      }
      throw new Error(`firmware artifact not found for ${env}`);
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
            const asset = this.selectRuntimeArtifact(release);
            return github.fetchAsset(asset).then((res) => res.text());
          }
          return github.fetchAsset(this.target).then((res) => res.text());

        case "branch":
          if (this.isRuntimeTarget && this.branch) {
            const branch = this.flash.branches[this.branch];
            const artifact = this.selectRuntimeArtifact(branch.artifacts);
            return github.fetchArtifact(artifact);
          }
          return github.fetchArtifact(this.target);

        case "pull_request":
          if (this.isRuntimeTarget && this.pullRequest) {
            const pullRequest = this.flash.pullRequests[this.pullRequest];
            const artifact = this.selectRuntimeArtifact(pullRequest.artifacts);
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
});
</script>
