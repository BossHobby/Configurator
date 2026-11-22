<template>
  <Panel title="Profile Backups" :description="description">
    <p v-if="!backups.length" class="text-sm text-muted">
      No backups for this craft yet.
    </p>
    <div v-else class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th scope="col">Saved</th>
            <th scope="col">Craft name</th>
            <th scope="col">Firmware</th>
            <th scope="col"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="backup in backups" :key="backup.id">
            <td :title="new Date(backup.saved).toLocaleString()">
              {{ ago(backup.saved) }}
            </td>
            <td>{{ backup.name || "–" }}</td>
            <td class="text-muted">{{ backup.firmware }}</td>
            <td>
              <div class="flex justify-end gap-2">
                <spinner-btn @click="download(backup)">Download</spinner-btn>
                <spinner-btn
                  :disabled="info.is_read_only"
                  @click="restore(backup)"
                  >Restore</spinner-btn
                >
                <spinner-btn @click="remove(backup)">Delete</spinner-btn>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </Panel>
</template>

<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
import { defineComponent } from "vue";
import YAML from "yaml";
import { useInfoStore } from "@/store/info";
import { useProfileStore } from "@/store/profile";
import { exportFile } from "@/store/util/export";
import { profileFilename } from "@/store/util/profile-yaml";
import {
  craftKey,
  profileBackups,
  uidHex,
  type ProfileBackup,
} from "@/store/util/profile-backup";
import { timeAgo } from "@/mixin/filters";

export default defineComponent({
  name: "ProfileBackups",
  components: { Panel },
  setup() {
    return {
      info: useInfoStore(),
      profile: useProfileStore(),
    };
  },
  data() {
    return {
      backups: [] as ProfileBackup[],
    };
  },
  computed: {
    craft() {
      return craftKey(this.info.craft);
    },
    description() {
      const kept =
        "Each profile read from or written to the craft, kept in this app.";
      const uid = uidHex(this.info.uid);
      if (uid) return `${kept} Craft ${uid}.`;
      return `${kept} This firmware sends no chip id, so every ${this.info.craft.target_name} board shares them.`;
    },
  },
  watch: {
    // A new profile from the board may have added a backup.
    "profile.meta.datetime": "load",
    craft: "load",
  },
  mounted() {
    this.load();
  },
  methods: {
    async load() {
      this.backups = await profileBackups().list(this.info.craft);
    },
    ago(ms: number) {
      return timeAgo(new Date(ms));
    },
    download(backup: ProfileBackup) {
      const profile = YAML.parse(backup.yaml);
      return exportFile(profileFilename(profile), backup.yaml);
    },
    async restore(backup: ProfileBackup) {
      await this.profile.apply_profile(YAML.parse(backup.yaml));
      await this.load();
    },
    async remove(backup: ProfileBackup) {
      await profileBackups().delete(backup.id!);
      await this.load();
    },
  },
});
</script>
