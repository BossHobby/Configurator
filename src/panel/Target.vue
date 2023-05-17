<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Target</p>
    </header>
    <div class="card-content">
      <div class="content column-narrow field-is-2">
        <template v-if="info.quicVersionGte('0.2.0')">
          <div class="field is-horizontal">
            <div class="field-label">
              <label class="label" for="name">Name</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control">
                  <input
                    class="input is-static"
                    :value="target.name"
                    readonly
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="field is-horizontal">
            <div class="field-label">
              <label class="label" for="name">MCU</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control">
                  <input class="input is-static" :value="info.mcu" readonly />
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="field is-horizontal">
            <div class="field-label">
              <label class="label" for="name">Name</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control">
                  <input
                    class="input is-static"
                    :value="info.target_name"
                    readonly
                  />
                </div>
              </div>
            </div>
          </div>
        </template>

        <div class="field is-horizontal" v-if="info.gyro_id != null">
          <div class="field-label">
            <label class="label">Gyro</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input
                  class="input is-static"
                  :value="info.gyro_name"
                  readonly
                />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal" v-if="info.features != null">
          <div class="field-label">
            <label class="label">Features</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input class="input is-static" :value="features" readonly />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <footer v-if="info.quicVersionGte('0.2.0')" class="card-footer">
      <spinner-btn class="card-footer-item" @click="downloadTarget">
        Save Target
      </spinner-btn>
      <spinner-btn class="card-footer-item" @click="uploadTarget">
        Load Target
      </spinner-btn>
    </footer>

    <input accept=".yaml" type="file" ref="file" style="display: none" />
    <a ref="downloadAnchor" target="_blank"></a>
  </div>
</template>

<script lang="ts">
import { useConstantStore } from "@/store/constants";
import { useInfoStore } from "@/store/info";
import { useTargetStore } from "@/store/target";
import { $enum } from "ts-enum-util";
import { computed, defineComponent } from "vue";
import YAML from "yaml";

export default defineComponent({
  name: "Target",
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
