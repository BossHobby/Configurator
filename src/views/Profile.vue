<template>
  <div class="columns is-multiline">
    <div class="column is-12 my-2"><Info></Info></div>
    <div class="column is-12">
      <div class="notification is-warning" v-show="info.quic_protocol_version < 5">
        Incompatible Firmware! <br />
        Please update to be able to change settings. <br />
        Current profile can be exported and loaded.
      </div>
      <div class="notification is-danger" v-show="state.failloop > 0">
        Faillop {{ failloopMessage }} ({{ state.failloop }}) Detected! <br />
        Please fix the issue to be able to change settings. <br />
      </div>
    </div>
    <div class="column is-12">
      <Metadata class="control-card"></Metadata>
    </div>
    <div class="column is-12 my-4">
      <div class="card control-card">
        <header class="card-header">
          <p class="card-header-title">Serial Passthrough</p>
          <tooltip class="card-header-icon" entry="serial_passthrough" />
        </header>

        <div class="card-content">
          <div class="content">
            <div class="columns">
              <div class="column is-4 my-2">
                <div class="select">
                  <input-select v-model.number="serial_port" :options="serialPorts" />
                </div>
              </div>
              <div class="column is-4 my-2">
                <div class="select">
                  <input-select v-model="preset" :options="presetOptions" />
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
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapState, mapActions, mapGetters } from "vuex";
import Metadata from "@/panel/Metadata.vue";
import Info from "@/panel/Info.vue";

export default defineComponent({
  name: "home",
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
  components: {
    Metadata,
    Info,
  },
  computed: {
    ...mapState(["info", "state"]),
    ...mapGetters(["failloopMessage"]),
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
