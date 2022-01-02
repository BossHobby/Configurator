<template>
  <b-container>
    <b-row>
      <b-col sm="12">
        <b-alert variant="warning" :show="info.quic_protocol_version < 5">
          Incompatible Firmware! <br />
          Please update to be able to change settings. <br />
          Current profile can be exported and loaded.
        </b-alert>
      </b-col>
      <b-col sm="12">
        <Metadata class="control-card"></Metadata>
      </b-col>
      <b-col sm="12">
        <b-card class="my-4 control-card">
          <h5 slot="header" class="mb-0">Serial Passthrough</h5>
          <b-row>
            <b-col sm="4" class="my-2">
              <b-form-select
                id="serial-port"
                v-model.number="serial_port"
                :options="serialPorts"
              ></b-form-select>
            </b-col>
            <b-col sm="4" class="my-2">
              <b-form-select
                id="baudrate"
                v-model.number="baudrate"
                :options="baudrateOptions"
              ></b-form-select>
            </b-col>
            <b-col sm="4" class="my-2">
              <b-button
                class="my-2 float-right"
                :disabled="serial_port == 0"
                @click="start_passthrough"
              >
                Start
              </b-button>
            </b-col>
          </b-row>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { mapState, mapActions } from "vuex";
import Metadata from "@/components/Metadata";

export default {
  name: "home",
  data() {
    return {
      serial_port: 0,
      baudrate: 420000,
      baudrateOptions: [420000],
    };
  },
  components: {
    Metadata,
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
        baudrate: this.baudrate,
      });
    },
  },
};
</script>
