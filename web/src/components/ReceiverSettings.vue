<template>
  <b-card>
    <h5 slot="header" class="mb-0">Receiver</h5>
    <b-row v-if="status.Info.rx_protocol != null">
      <b-col sm="4" class="my-2">
        <label>Protocol</label>
      </b-col>
      <b-col sm="8" class="my-2">{{
        protoNames[status.Info.rx_protocol]
      }}</b-col>
    </b-row>
    <b-row v-if="status.Info.quic_protocol_version > 3">
      <b-col sm="4" class="my-2">
        <label>LQI Source</label>
      </b-col>
      <b-col sm="4" class="my-2">
        <b-form-select
          v-model.number="receiver_lqi_source"
          :options="lqiSourceNames"
        ></b-form-select>
      </b-col>
    </b-row>
    <b-row v-if="status.Info.quic_protocol_version > 2">
      <b-col sm="4" class="my-2">
        <label>Bind Enabled</label>
      </b-col>
      <b-col sm="8" class="my-2">{{
        bind.info.bind_enable ? "yes" : "no"
      }}</b-col>
    </b-row>
    <b-row v-if="status.Info.quic_protocol_version > 2">
      <b-col sm="4" class="my-2">
        <label>RSSI</label>
      </b-col>
      <b-col sm="8" class="my-2">{{ state.rx_rssi }}</b-col>
    </b-row>
    <b-row v-if="status.Info.quic_protocol_version > 2">
      <b-col sm="4" class="my-2">
        <label>Status</label>
      </b-col>
      <b-col sm="8" class="my-2">{{ protoStatus }}</b-col>
    </b-row>
    <b-row
      v-if="
        status.Info.quic_protocol_version > 2 &&
        status.Info.rx_protocol == proto.UNIFIED_SERIAL
      "
    >
      <b-col sm="4" class="my-2">
        <label>Protocol</label>
      </b-col>
      <b-col sm="8" class="my-2">{{ serialProtoStatus }}</b-col>
    </b-row>
  </b-card>
</template>

<script>
import { mapState, mapActions } from "vuex";
import { mapFields } from "@/store/helper.js";

export default {
  name: "ReceiverSettings",
  data() {
    return {
      intervalEnabled: true,
      lqiSourceNames: [
        { value: 0, text: "PACKET_RATE" },
        { value: 1, text: "CHANNEL" },
        { value: 2, text: "DIRECT" },
      ],
      protoNames: [
        "INVALID",
        "UNIFIED_SERIAL",
        "SBUS",
        "CRSF",
        "IBUS",
        "FPORT",
        "DSMX_2048",
        "DSM2_1024",
        "NRF24_BAYANG_TELEMETRY",
        "BAYANG_PROTOCOL_BLE_BEACON",
        "BAYANG_PROTOCOL_TELEMETRY_AUTOBIND",
        "FRSKY_D8",
        "FRSKY_D16",
        "REDPINE",
      ],
      serialProtoNames: [
        "SERIAL_INVALID",
        "SERIAL_DSM",
        "SERIAL_SBUS",
        "SERIAL_IBUS",
        "SERIAL_FPORT",
        "SERIAL_CRSF",
        "SERIAL_REDPINE",
        "SERIAL_SBUS_INVERTED",
        "SERIAL_FPORT_INVERTED",
        "SERIAL_REDPINE_INVERTED",
      ],
    };
  },
  computed: {
    ...mapFields("profile", ["receiver.lqi_source"]),
    ...mapState(["status", "state", "bind"]),
    proto() {
      return this.protoNames.reduce((m, v, i) => {
        m[v] = i;
        return m;
      }, {});
    },
    serialProto() {
      return this.serialProtoNames.reduce((m, v, i) => {
        m[v] = i;
        return m;
      }, {});
    },
    protoStatus() {
      const spi = [
        this.proto.FRSKY_D8,
        this.proto.FRSKY_D16,
        this.proto.REDPINE,
      ];
      if (spi.includes(this.status.Info.rx_protocol)) {
        const status = [
          "RX_STATUS_NONE",
          "RX_STATUS_BINDING",
          "RX_STATUS_BOUND",
        ];
        return status[this.state.rx_status];
      }
      if (this.status.Info.rx_protocol == this.proto.UNIFIED_SERIAL) {
        if (this.state.rx_status < 100) {
          return "RX_STATUS_NONE";
        }
        if (this.state.rx_status >= 100 && this.state.rx_status < 200) {
          return "RX_STATUS_DETECTING";
        }
        if (this.state.rx_status >= 200 && this.state.rx_status < 300) {
          return "RX_STATUS_DETECTED";
        }
      }
      return "";
    },
    serialProtoStatus() {
      var index = 0;

      if (this.state.rx_status >= 100 && this.state.rx_status < 200) {
        index = this.state.rx_status - 100;
      } else if (this.state.rx_status >= 200 && this.state.rx_status < 300) {
        index = this.state.rx_status - 200;
      }

      return this.serialProtoNames[index];
    },
  },
  methods: {
    ...mapActions(["fetch_bind_info"]),
    startInterval() {
      return this.fetch_bind_info().then(() => {
        if (!this.intervalEnabled) {
          return;
        }
        setTimeout(() => this.startInterval(), 5000);
      });
    },
  },
  created() {
    if (this.status.Info.quic_protocol_version > 2) {
      this.startInterval();
    }
  },
  beforeDestroy() {
    this.intervalEnabled = false;
  },
};
</script>
