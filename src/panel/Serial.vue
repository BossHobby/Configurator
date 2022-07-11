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
                  v-model.number="serial.rx"
                  :options="serialPorts"
                ></input-select>
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">
              Smart Audio
              <tooltip entry="serial.smart_audio" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input-select
                  class="is-fullwidth"
                  id="smart-audio"
                  v-model.number="serial.smart_audio"
                  :options="serialPorts"
                ></input-select>
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">
              HDZero
              <tooltip entry="serial.hdzero" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input-select
                  class="is-fullwidth"
                  id="hdzero"
                  v-model.number="serial.hdzero"
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
import { mapState } from "vuex";
import { mapFields } from "@/store/helper.js";

export default defineComponent({
  name: "serial",
  computed: {
    ...mapFields("profile", ["serial"]),
    ...mapState(["info"]),
    serialPorts() {
      const ports = [{ value: 0, text: "None" }];
      for (let i = 1; i < this.info.usart_ports.length; i++) {
        ports.push({ value: i, text: this.info.usart_ports[i] });
      }
      return ports;
    },
  },
});
</script>
