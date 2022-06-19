<template>
  <b-container>
    <b-row>
      <b-col class="my-2" sm="12"><Info></Info></b-col>
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
      <b-col class="my-4" sm="12">
        <b-card class="control-card">
          <h5 slot="header" class="mb-0">
            Serial Passthrough
            <tooltip entry="serial_passthrough" />
          </h5>
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
                id="preset"
                v-model="preset"
                :options="presetOptions"
              ></b-form-select>
            </b-col>
            <b-col sm="2" class="my-2">
              <b-button
                class="my-2 float-right"
                :disabled="serial_port == 0 || preset == null"
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
import Metadata from "@/components/Metadata.vue";
import Info from "@/components/Info.vue";

export default {
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
        ...this.preset,
      });
    },
  },
};
</script>
