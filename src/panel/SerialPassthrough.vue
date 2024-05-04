<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Serial Passthrough</p>
      <tooltip class="card-header-icon" entry="serial_passthrough" size="lg" />
    </header>

    <div class="card-content">
      <div class="content">
        <div class="columns">
          <div class="column is-6">
            <div class="field">
              <label class="label">Serial Port</label>
              <div class="control is-expanded">
                <input-select
                  v-model.number="serial_port"
                  class="is-fullwidth"
                  :options="serialPorts"
                />
              </div>
            </div>
          </div>

          <div class="column is-6">
            <div class="field">
              <label class="label">Preset</label>
              <div class="control is-expanded">
                <input-select
                  v-model="preset"
                  class="is-fullwidth"
                  :options="presetOptions"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <footer class="card-footer">
      <span class="card-footer-item"></span>
      <span class="card-footer-item"></span>
      <spinner-btn
        class="card-footer-item"
        :disabled="serial_port == 0 || preset == null"
        @click="start_passthrough"
      >
        Start
      </spinner-btn>
    </footer>
  </div>
</template>

<script lang="ts">
import { useSerialStore } from "@/store/serial";
import { useTargetStore } from "@/store/target";
import { defineComponent } from "vue";

export default defineComponent({
  name: "SerialPassthrough",
  setup() {
    return {
      target: useTargetStore(),
      serial: useSerialStore(),
    };
  },
  data() {
    return {
      serial_port: 0,
      preset: null,
      presetOptions: [
        { value: null, text: "Please select an option" },
        {
          text: "ExpressLRS",
          value: {
            baudrate: 420000,
            half_duplex: false,
            stop_bits: 1,
          },
        },
        {
          text: "OpenVTX",
          value: {
            baudrate: 4800,
            half_duplex: true,
            stop_bits: 2,
          },
        },
      ],
    };
  },
  computed: {
    serialPorts() {
      const ports = [{ value: 0, text: "SERIAL_PORT_INVALID" }];
      for (const [key, val] of Object.entries(this.target.serial_port_names)) {
        ports.push({ value: val, text: key });
      }
      return ports;
    },
  },
  methods: {
    start_passthrough() {
      return this.serial.serial_passthrough({
        port: this.serial_port,
        ...(this.preset || {}),
      });
    },
  },
});
</script>
