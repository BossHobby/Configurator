<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Serial</p>
    </header>

    <div class="card-content">
      <div class="content column-narrow field-is-5">
        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">
              RX
              <tooltip entry="serial.rx" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input-select
                  class="is-fullwidth"
                  id="rx"
                  v-model.number="profile.serial.rx"
                  :options="serialPorts"
                ></input-select>
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">
              VTX
              <tooltip entry="serial.smart_audio" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input-select
                  class="is-fullwidth"
                  id="smart-audio"
                  v-model.number="profile.serial.smart_audio"
                  :options="serialPorts"
                ></input-select>
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">
              Digital VTX
              <tooltip entry="serial.digital_vtx" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input-select
                  class="is-fullwidth"
                  id="digital_vtx"
                  v-model.number="profile.serial.hdzero"
                  :options="serialPorts"
                ></input-select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useProfileStore } from "@/store/profile";
import { useRootStore } from "@/store/root";
import { useTargetStore } from "@/store/target";

export default defineComponent({
  name: "serial",
  setup() {
    return {
      root: useRootStore(),
      target: useTargetStore(),
      profile: useProfileStore(),
    };
  },
  computed: {
    serialPorts() {
      const ports = [{ value: 0, text: "None" }];
      for (const [key, val] of Object.entries(this.target.serial_port_names)) {
        ports.push({ value: val, text: key });
      }
      return ports;
    },
  },
  watch: {
    "profile.serial": {
      handler() {
        this.root.set_needs_reboot();
      },
      deep: true,
    },
  },
});
</script>
