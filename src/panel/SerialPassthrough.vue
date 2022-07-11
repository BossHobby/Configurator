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
                  class="is-fullwidth"
                  v-model.number="serial_port"
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
                  class="is-fullwidth"
                  v-model="preset"
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
      <button
        class="card-footer-item button"
        :disabled="serial_port == 0 || preset == null"
        @click="start_passthrough"
      >
        Start
      </button>
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapState, mapActions } from "vuex";

export default defineComponent({
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
    ...mapState(["info"]),
    serialPorts() {
      const ports = [{ value: 0, text: "UART_INVALID" }];
      for (let i = 1; i < this.info.usart_ports.length; i++) {
        ports.push({ value: i, text: this.info.usart_ports[i] });
      }
      return ports;
    },
  },
  methods: {
    ...mapActions(["serial_passthrough"]),
    start_passthrough() {
      return this.serial_passthrough({
        port: this.serial_port,
        ...(this.preset || {}),
      });
    },
  },
});
</script>
