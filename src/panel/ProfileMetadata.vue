<template>
  <Panel title="Craft Profile" class="flex flex-col">
    <label class="block text-xs text-muted"
      >Craft name<input
        v-model="profile.meta.name"
        class="mt-1.5 min-h-9 w-full rounded-md border border-line bg-subtle px-3 py-2 text-sm text-ink"
    /></label>
    <dl class="mb-5 mt-4 space-y-3 text-sm">
      <div class="flex justify-between gap-4">
        <dt class="text-muted">Last modified</dt>
        <dd>{{ profile.modified }}</dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt class="text-muted">Firmware</dt>
        <dd>
          <a :href="versionLink" target="_blank" class="text-accent">{{
            info.git_version
          }}</a>
        </dd>
      </div>
    </dl>
    <div class="mt-auto flex flex-wrap gap-2 border-t border-line pt-4">
      <spinner-btn @click="downloadProfile">Save profile</spinner-btn>
      <spinner-btn :disabled="info.is_read_only" @click="uploadProfile"
        >Load profile</spinner-btn
      >
      <spinner-btn class="ml-auto" @click="profile.reset"
        >Reset profile</spinner-btn
      >
    </div>
    <input ref="file" accept=".yaml" type="file" hidden />
  </Panel>
</template>
<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
import { defineComponent } from "vue";
import YAML from "yaml";
import { exportFile } from "@/store/util/export";
import { profileFilename, profileToYaml } from "@/store/util/profile-yaml";
import { serial } from "../store/serial/serial";
import { QuicVal } from "@/store/serial/quic";
import { useInfoStore } from "@/store/info";
import { useStateStore } from "@/store/state";
import { useProfileStore } from "@/store/profile";
import { useSerialStore } from "@/store/serial";

export default defineComponent({
  name: "ProfileMetadata",
  components: { Panel },
  setup() {
    return {
      state: useStateStore(),
      info: useInfoStore(),
      profile: useProfileStore(),
      serial: useSerialStore(),
    };
  },
  computed: {
    date() {
      return new Date(this.profile.meta.datetime * 1000);
    },

    fileRef(): HTMLInputElement {
      return this.$refs.file as HTMLInputElement;
    },
    versionLink() {
      if (/^(v\d\..*)/.test(this.info.git_version)) {
        return (
          "https://github.com/BossHobby/QUICKSILVER/releases/tag/" +
          this.info.git_version
        );
      }
      return (
        "https://github.com/BossHobby/QUICKSILVER/commit/" +
        this.info.git_version
      );
    },
  },
  methods: {
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
      return serial
        .get(QuicVal.Profile)
        .then((profile) =>
          exportFile(profileFilename(profile), profileToYaml(profile)),
        );
    },
  },
});
</script>

<style scoped></style>
