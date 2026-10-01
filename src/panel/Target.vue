<template>
  <Panel title="Flight Controller" class="flex flex-col">
    <dl class="mb-5 grid gap-4 sm:grid-cols-2">
      <div>
        <dt class="mb-1 text-xs text-muted">Target</dt>
        <dd class="text-sm">
          {{ info.quic_semver_gte("0.2.0") ? target.name : info.target_name }}
        </dd>
      </div>
      <div v-if="info.quic_semver_gte('0.2.0')">
        <dt class="mb-1 text-xs text-muted">MCU</dt>
        <dd class="text-sm">{{ info.mcu }}</dd>
      </div>
      <div v-if="info.quic_semver_gte('0.2.0')">
        <dt class="mb-1 text-xs text-muted">Vehicle</dt>
        <dd class="text-sm">{{ vehicleType }}</dd>
      </div>
      <div>
        <dt class="mb-1 text-xs text-muted">Gyro</dt>
        <dd class="text-sm">{{ info.gyro_name }}</dd>
      </div>
      <div class="sm:col-span-2">
        <dt class="mb-1 text-xs text-muted">Features</dt>
        <dd class="text-sm">{{ features }}</dd>
      </div>
    </dl>
    <div
      v-if="info.quic_semver_gte('0.2.0')"
      class="mt-auto flex gap-2 border-t border-line pt-4"
    >
      <spinner-btn @click="downloadTarget">Save target</spinner-btn>
      <spinner-btn @click="uploadTarget">Load target</spinner-btn>
    </div>
    <input ref="file" accept=".yaml" type="file" hidden />
    <a ref="downloadAnchor" target="_blank" hidden></a>
  </Panel>
</template>
<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
import { useConstantStore } from "@/store/constants";
import { useInfoStore } from "@/store/info";
import { useTargetStore } from "@/store/target";
import { vehicle_type_t } from "@/store/types";
import { $enum } from "ts-enum-util";
import { computed, defineComponent } from "vue";
import YAML from "yaml";

export default defineComponent({
  name: "Target",
  components: { Panel },
  setup() {
    const constants = useConstantStore();

    return {
      info: useInfoStore(),
      target: useTargetStore(),

      Features: computed(() => constants.Features),
      GyroType: computed(() => constants.GyroType),
    };
  },
  computed: {
    fileRef(): HTMLInputElement {
      return this.$refs.file as HTMLInputElement;
    },
    downloadAnchorRef(): HTMLAnchorElement {
      return this.$refs.downloadAnchor as HTMLAnchorElement;
    },

    features() {
      return $enum(this.Features)
        .getKeys()
        .filter((f, i) => {
          return this.info.features & (1 << (i + 1));
        })
        .join(", ");
    },
    vehicleType() {
      if (this.info.vehicle_type & vehicle_type_t.VEHICLE_TYPE_WING) {
        return "Wing";
      }
      if (this.info.vehicle_type & vehicle_type_t.VEHICLE_TYPE_ROVER) {
        return "Rover";
      }
      return "Multirotor";
    },
  },
  methods: {
    uploadTarget() {
      const reader = new FileReader();
      reader.addEventListener("load", (event) => {
        if (event?.target?.result) {
          const target = YAML.parse(event?.target?.result as string);
          this.target.apply(target);
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
    downloadTarget() {
      const encoded = encodeURIComponent(this.target.yaml);
      const yaml = "data:text/yaml;charset=utf-8," + encoded;

      const date = new Date().toISOString().substring(0, 10);
      const filename = `Target_${this.target.name}_${date}.yaml`;

      this.downloadAnchorRef.setAttribute("href", yaml);
      this.downloadAnchorRef.setAttribute("download", filename);
      this.downloadAnchorRef.click();
    },
  },
});
</script>

<style scoped>
.w-100 {
  width: 100%;
}
</style>
