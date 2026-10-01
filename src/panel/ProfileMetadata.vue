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
    <!-- Phones: one even row; the card title already says "profile". -->
    <div
      class="mt-auto flex flex-wrap gap-2 border-t border-line pt-4 max-sm:grid max-sm:grid-cols-3 max-sm:*:w-full"
    >
      <spinner-btn @click="downloadProfile"
        >Save<span class="max-sm:hidden"> profile</span></spinner-btn
      >
      <spinner-btn :disabled="info.is_read_only" @click="uploadProfile"
        >Load<span class="max-sm:hidden"> profile</span></spinner-btn
      >
      <spinner-btn class="sm:ml-auto" @click="profile.reset"
        >Reset<span class="max-sm:hidden"> profile</span></spinner-btn
      >
    </div>
    <input ref="file" accept=".yaml" type="file" hidden />
    <a ref="downloadAnchor" target="_blank" hidden></a>
  </Panel>
</template>
<script lang="ts">
import { exportText } from "@/store/util/export";
import Panel from "@/components/ui/Panel.vue";
import { defineComponent } from "vue";
import YAML from "yaml";
import { serial } from "../store/serial/serial";
import { QuicVal } from "@/store/serial/quic";
import { useInfoStore } from "@/store/info";
import { useStateStore } from "@/store/state";
import { useProfileStore } from "@/store/profile";
import { useSerialStore } from "@/store/serial";

function bindRawToBase64(raw: unknown): string | unknown {
  if (!(raw instanceof Uint8Array)) {
    return raw;
  }

  let binary = "";
  for (const byte of raw) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function encodeProfileForYaml(profile: any) {
  const yamlProfile = structuredClone(profile);
  const bind = yamlProfile.receiver?.bind;
  if (bind?.raw) {
    bind.raw = bindRawToBase64(bind.raw);
  }
  return yamlProfile;
}

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
    downloadAnchorRef(): HTMLAnchorElement {
      return this.$refs.downloadAnchor as HTMLAnchorElement;
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
      return serial.get(QuicVal.Profile).then((profile) => {
        const yamlProfile = encodeProfileForYaml(profile);
        const yaml = YAML.stringify(yamlProfile);

        const date = this.date.toISOString().substring(0, 10);
        const name = profile.meta.name.replace(/\0/g, "");
        const filename = `Profile_${name}_${date}.yaml`;

        return exportText(filename, yaml, "text/yaml");
      });
    },
  },
});
</script>

<style scoped></style>
