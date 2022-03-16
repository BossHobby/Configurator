<template>
  <b-card>
    <h5 slot="header" class="mb-0">
      Receiver
      <b-button size="sm" class="my-2 mx-2" @click="reset">Reset</b-button>
    </h5>
    <b-row v-if="info.rx_protocol != null">
      <b-col sm="4" class="my-2">
        <label>
          Protocol
          <tooltip entry="receiver.protocol" />
        </label>
      </b-col>
      <b-col sm="8" class="my-2">{{ protoNames[info.rx_protocol] }}</b-col>
    </b-row>
    <b-row v-if="info.quic_protocol_version > 3">
      <b-col sm="4" class="my-2">
        <label>
          LQI Source
          <tooltip entry="receiver.lqi_source" />
        </label>
      </b-col>
      <b-col sm="4" class="my-2">
        <b-form-select
          v-model.number="receiver_lqi_source"
          :options="lqiSourceNames"
        ></b-form-select>
      </b-col>
    </b-row>
    <b-row v-if="info.quic_protocol_version > 2">
      <b-col sm="4" class="my-2">
        <label>
          Bind Saved
          <tooltip entry="receiver.bind_saved" />
        </label>
      </b-col>
      <b-col sm="8" class="my-2">{{
        bind.info.bind_saved ? "yes" : "no"
      }}</b-col>
    </b-row>
    <b-row v-if="info.quic_protocol_version > 2">
      <b-col sm="4" class="my-2">
        <label>RSSI</label>
      </b-col>
      <b-col sm="8" class="my-2">{{ state.rx_rssi }}</b-col>
    </b-row>
    <b-row v-if="info.quic_protocol_version > 2">
      <b-col sm="4" class="my-2">
        <label>Status</label>
      </b-col>
      <b-col sm="8" class="my-2">{{ protoStatus }}</b-col>
    </b-row>
    <b-row
      v-if="
        info.quic_protocol_version > 2 &&
        info.rx_protocol == proto.UNIFIED_SERIAL
      "
    >
      <b-col sm="4" class="my-2">
        <label>Protocol</label>
      </b-col>
      <b-col sm="8" class="my-2">{{ serialProtoStatus }}</b-col>
    </b-row>
    <b-row>
      <b-col sm="12" class="my-2">
        <small>
          Save Bind by moving your right transmitter stick UP-UP-UP followed by
          DOWN-DOWN-DOWN
        </small>
      </b-col>
    </b-row>

    <b-card
      class="mt-4"
      v-if="bind.info.raw && info.rx_protocol == proto.EXPRESS_LRS"
    >
      <h5 slot="header" class="mb-0">ExpressLRS</h5>
      <b-row>
        <b-col sm="4" class="my-2">
          <label>Switch Mode</label>
        </b-col>
        <b-col sm="8" class="my-2">{{ elrsSwitchMode }}</b-col>
      </b-row>
      <b-row>
        <b-col sm="4" class="my-2">
          <label>Current Bind Phrase</label>
        </b-col>
        <b-col sm="8" class="my-2">{{ elrsBindPhrase }}</b-col>
      </b-row>
      <b-row>
        <b-col sm="4" class="my-2">
          <label>New Bind Phrase</label>
        </b-col>
        <b-col sm="4" class="my-2">
          <b-form-input
            id="name"
            type="text"
            v-model="elrsBindPhraseInput"
          ></b-form-input>
        </b-col>
      </b-row>
      <b-row>
        <b-col offset="10" sm="2">
          <b-button
            class="ml-auto mr-1 mt-2"
            v-on:click="apply_elrs_bind_phrase(elrsBindPhraseInput)"
            :disabled="elrsBindPhraseInput.length < 4"
          >
            Apply
          </b-button>
        </b-col>
      </b-row>
    </b-card>

    <b-card class="mt-4" v-if="bind.info.raw && isSpiProtocol">
      <h5 slot="header" class="mb-0">Bind Data</h5>
      <b-row>
        <b-col sm="10">
          Save and load bind information for spi protocols.<br />
          Requires reboot after load.
        </b-col>
        <b-col sm="2">
          <b-button class="my-2" @click="downloadBindData">
            Save Bind Data
          </b-button>
          <form ref="form">
            <input
              accept=".base64"
              type="file"
              ref="file"
              style="display: none"
            />
            <b-button class="my-2" @click="uploadBindData">
              Load Bind Data
            </b-button>
          </form>
        </b-col>
        <a ref="downloadAnchor" target="_blank"></a>
      </b-row>
    </b-card>
  </b-card>
</template>

<script>
import { mapState, mapActions, mapGetters } from "vuex";
import { mapFields } from "@/store/helper.js";
import { $enum } from "ts-enum-util";
import * as md5 from "md5";

export default {
  name: "ReceiverSettings",
  data() {
    return {
      lqiSourceNames: [
        { value: 0, text: "PACKET_RATE" },
        { value: 1, text: "CHANNEL" },
        { value: 2, text: "DIRECT" },
      ],
      elrsBindPhraseInput: "",
    };
  },
  computed: {
    ...mapFields("profile", ["receiver.lqi_source", "meta"]),
    ...mapState(["info", "state", "bind"]),
    ...mapState("constants", {
      serialProtoNames: (state) => $enum(state.RXSerialProtocol).getKeys(),
    }),
    ...mapGetters("constants", ["RXProtocol"]),
    date() {
      return new Date(this.meta.datetime * 1000);
    },
    protoNames() {
      return $enum(this.RXProtocol).getKeys();
    },
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
    isSpiProtocol() {
      const spi = [
        this.proto.FRSKY_D8,
        this.proto.FRSKY_D16,
        this.proto.REDPINE,
      ];
      return spi.includes(this.info.rx_protocol);
    },
    protoStatus() {
      const spi = [
        this.proto.FRSKY_D8,
        this.proto.FRSKY_D16,
        this.proto.REDPINE,
        this.proto.EXPRESS_LRS,
      ];
      if (spi.includes(this.info.rx_protocol)) {
        const status = [
          "RX_STATUS_NONE",
          "RX_STATUS_BINDING",
          "RX_STATUS_BOUND",
        ];
        return status[this.state.rx_status];
      }
      if (this.info.rx_protocol == this.proto.UNIFIED_SERIAL) {
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
    elrsBindPhrase() {
      return this.bind?.info?.raw?.slice(1, 7).join(", ");
    },
    elrsSwitchMode() {
      return this.bind?.info?.raw[8] ? "Hybrid Switches" : "1Bit Switches";
    },
  },
  methods: {
    ...mapActions(["apply_bind_info"]),
    parseHexString(str) {
      const result = [];
      while (str.length >= 2) {
        result.push(parseInt(str.substring(0, 2), 16));
        str = str.substring(2, str.length);
      }
      return result;
    },
    apply_elrs_bind_phrase(input) {
      const hex = md5(`-DMY_BINDING_PHRASE="${input}"`);
      const bytes = this.parseHexString(hex).slice(0, 6);

      const info = { ...this.bind?.info };
      info.bind_saved = 1;

      info.raw[0] = 1;
      for (let i = 0; i < 6; i++) {
        info.raw[i + 1] = bytes[i];
      }
      info.raw[7] = 0x37;

      return this.apply_bind_info(info);
    },
    downloadBindData() {
      const base64 = window.btoa(
        String.fromCharCode(...new Uint8Array(this.bind.info.raw))
      );
      const encoded = encodeURIComponent(base64);
      const json = "data:application/octet-stream;charset=utf-8," + encoded;

      const date = this.date.toISOString().substring(0, 10);
      const name = this.meta.name.replace(/\0/g, "");
      const filename = `BindData_${name}_${date}.base64`;

      this.$refs.downloadAnchor.setAttribute("href", json);
      this.$refs.downloadAnchor.setAttribute("download", filename);
      this.$refs.downloadAnchor.click();
    },
    uploadBindData() {
      const reader = new FileReader();
      reader.addEventListener("load", (event) => {
        const info = { ...this.bind?.info };
        info.bind_saved = 1;
        info.raw = Uint8Array.from(window.atob(event.target.result), (c) =>
          c.charCodeAt(0)
        );

        this.apply_bind_info(info);
      });

      this.$refs.file.oninput = () => {
        if (!this.$refs.file.files.length) {
          return;
        }
        reader.readAsText(this.$refs.file.files[0]);
      };

      this.$refs.file.click();
    },
    reset() {
      const info = { ...this.bind?.info };
      info.bind_saved = 0;
      for (let i = 0; i < info.raw.length; i++) {
        info.raw[i] = 0;
      }

      return this.apply_bind_info(info);
    },
  },
  created() {},
};
</script>
