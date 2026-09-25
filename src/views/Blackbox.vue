<template>
  <div class="grid items-stretch gap-4 lg:grid-cols-2">
    <Panel v-if="info.quic_semver_gt('0.1.2')" title="Recording Settings">
      <div class="space-y-4">
        <div class="flex items-end gap-2">
          <FieldSelect
            v-model="current_preset"
            class="flex-1"
            label="Preset"
            :options="
              blackboxPresets.map((o) => ({ label: o.text, value: o.value }))
            "
          /><spinner-btn
            :disabled="current_preset === -1"
            @click="load_preset(current_preset)"
            >Load</spinner-btn
          >
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <FieldSelect
            v-model="profile.blackbox.sample_rate_hz"
            label="Log rate"
            :options="
              logRateOptions.map((o) => ({ label: o.text, value: o.value }))
            "
          />
          <FieldSelect
            v-model="debugMode"
            label="Debug mode"
            :options="
              debugModeOptions.map((o) => ({ label: o.text, value: o.value }))
            "
          />
        </div>
        <div>
          <p class="mb-2 text-xs text-muted">Recorded fields</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="field in blackboxFields"
              :key="field"
              class="rounded border border-line bg-subtle px-2 py-1 text-xs"
              >{{ field }}</span
            >
          </div>
        </div>
      </div>
    </Panel>
    <Panel v-if="blackbox.list" title="Flight Logs">
      <p class="mb-2 text-xs text-muted">
        {{ humanFileSize(usedSize) }} of
        {{ humanFileSize(blackbox.list.flash_size * 1024) }} used
      </p>
      <progress
        class="h-2 w-full accent-accent"
        :value="usedSize"
        :max="(blackbox.list.flash_size || 1) * 1024"
        aria-label="Blackbox storage used"
      ></progress>
      <div
        v-if="!blackbox.list.files?.length"
        class="py-8 text-center text-sm text-muted"
      >
        No recorded flights on this controller.
      </div>
      <div
        v-for="(file, index) in blackbox.list.files"
        :key="index"
        class="flex flex-wrap items-center gap-2 border-b border-line py-3"
      >
        <span class="mr-auto text-sm"
          >Flight {{ index + 1 }} · {{ humanFileSize(file.size) }}</span
        >
        <spinner-btn @click="download_btfl(index)">BTFL</spinner-btn
        ><spinner-btn @click="download_quic(index)">QUIC</spinner-btn>
      </div>
      <a ref="downloadAnchor" target="_blank" hidden></a>
      <div v-if="blackbox.progress" class="mt-4 text-xs text-muted">
        Downloading {{ humanFileSize(blackbox.speed || 0) }}/s…<progress
          class="w-full accent-accent"
          :value="blackbox.progress"
          max="1"
        ></progress>
      </div>
      <div
        class="mt-4 flex items-center justify-between border-t border-line pt-4"
      >
        <span class="text-xs text-muted"
          >{{ blackbox.list.files?.length || 0 }} files</span
        ><spinner-btn @click="reset()">Erase logs</spinner-btn>
      </div>
    </Panel>
  </div>
</template>
<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
import FieldSelect from "@/components/ui/Select.vue";
import { humanFileSize } from "@/mixin/filters";
import {
  useBlackboxStore,
  BlackboxFields,
  transformBlackboxFieldFlags,
} from "@/store/blackbox";
import { BlackboxField, BlackboxDebugFlag } from "@/store/constants";
import { useInfoStore } from "@/store/info";
import { useProfileStore } from "@/store/profile";
import { useStateStore } from "@/store/state";
import { $enum } from "ts-enum-util";
import { defineComponent } from "vue";

export default defineComponent({
  name: "Blackbox",
  components: { Panel, FieldSelect },
  setup() {
    return {
      blackbox: useBlackboxStore(),
      profile: useProfileStore(),
      state: useStateStore(),
      info: useInfoStore(),
    };
  },
  data() {
    return {
      current_preset: -1,
      BlackboxDebugFlag,
    };
  },
  computed: {
    usedSize() {
      return (this.blackbox?.list?.files || []).reduce((p, c) => p + c.size, 0);
    },
    blackboxFields() {
      const fieldflags = transformBlackboxFieldFlags(
        this.profile.blackbox.field_flags,
        this.info.quic_protocol_semver,
      );
      const fields = $enum(BlackboxField)
        .getEntries()
        .map((key, val) => {
          return {
            val: val,
            title: BlackboxFields[val].title,
            active: (fieldflags & (1 << val)) > 0,
          };
        });
      if (fields.every((p) => p.active)) {
        return ["All"];
      }
      return fields.filter((p) => p.active).map((p) => p.title);
    },
    blackboxPresets() {
      return [
        { value: -1, text: "Choose..." },
        ...this.blackbox.presets.map((p, i) => {
          return {
            value: i,
            text: p.name,
          };
        }),
      ];
    },
    debugMode: {
      get(): number {
        return this.profile.blackbox.debug_flags;
      },
      set(value: number) {
        this.profile.blackbox.debug_flags = value;
        if (value !== 0) {
          this.profile.blackbox.field_flags |=
            1 <<
            (this.info.quic_semver_gte("0.2.10") ? BlackboxField.DEBUG : 13);
          if (
            value === BlackboxDebugFlag.BBOX_DEBUG_NAVIGATION &&
            this.info.quic_semver_gte("0.2.10")
          ) {
            this.profile.blackbox.field_flags |=
              (1 << BlackboxField.GPS_COORD) |
              (1 << BlackboxField.GPS_HOME) |
              (1 << BlackboxField.ALTITUDE);
          }
        }
      },
    },
    debugModeOptions() {
      return [
        { value: 0, text: "None" },
        {
          value: BlackboxDebugFlag.BBOX_DEBUG_DYN_NOTCH,
          text: "Dynamic Notch",
        },
        { value: BlackboxDebugFlag.BBOX_DEBUG_ROVER, text: "Rover" },
        {
          value: BlackboxDebugFlag.BBOX_DEBUG_NAVIGATION,
          text: "Navigation / RTH",
        },
      ];
    },
    logRateOptions() {
      return [
        { value: 200, text: "200 Hz" },
        { value: 1000, text: "1 kHz" },
        { value: 2000, text: "2 kHz" },
        { value: 4000, text: "4 kHz" },
      ];
    },
  },
  created() {
    this.blackbox.list_blackbox();
    if (this.info.quic_semver_gt("0.1.2")) {
      this.blackbox.fetch_presets();
    }
  },
  methods: {
    humanFileSize,
    reset() {
      return this.blackbox
        .reset_blackbox()
        .then(() => this.blackbox.list_blackbox());
    },
    download_quic(index) {
      return this.blackbox.download_blackbox_quic(index).then((url) => {
        const date = new Date().toISOString().substring(0, 10);
        const name = this.profile.meta.name.replace(/\0/g, "");
        const filename = `QUIC_${name}_${date}_file_${index}.json`;

        this.$refs.downloadAnchor.setAttribute("href", url);
        this.$refs.downloadAnchor.setAttribute("download", filename);
        this.$refs.downloadAnchor.click();
      });
    },
    download_btfl(index) {
      return this.blackbox.download_blackbox_btfl(index).then((url) => {
        const date = new Date().toISOString().substring(0, 10);
        const name = this.profile.meta.name.replace(/\0/g, "");
        const filename = `QUIC_${name}_${date}_file_${index}.bfl`;

        this.$refs.downloadAnchor.setAttribute("href", url);
        this.$refs.downloadAnchor.setAttribute("download", filename);
        this.$refs.downloadAnchor.click();
      });
    },
    load_preset(i: number) {
      this.profile.blackbox.field_flags = this.blackbox.presets[i].field_flags;
      this.profile.blackbox.sample_rate_hz =
        this.blackbox.presets[i].sample_rate_hz;
      if (this.profile.blackbox.debug_flags !== 0) {
        this.profile.blackbox.field_flags |=
          1 << (this.info.quic_semver_gte("0.2.10") ? BlackboxField.DEBUG : 13);
      }
      if (
        this.profile.blackbox.debug_flags ===
          BlackboxDebugFlag.BBOX_DEBUG_NAVIGATION &&
        this.info.quic_semver_gte("0.2.10")
      ) {
        this.profile.blackbox.field_flags |=
          (1 << BlackboxField.GPS_COORD) |
          (1 << BlackboxField.GPS_HOME) |
          (1 << BlackboxField.ALTITUDE);
      }
      this.current_preset = -1;
    },
  },
});
</script>

<style lang="scss">
.blackbox-progress {
  width: 50%;
  margin: 10px;
}
</style>
