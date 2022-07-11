<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Receiver</p>
      <button class="card-header-button button is-warning" @click="reset">
        Reset
      </button>
    </header>

    <div class="card-content">
      <div class="content field-is-2">
        <div
          class="field is-horizontal"
          v-if="info.rx_protocol != null && receiver_protocol == null"
        >
          <div class="field-label">
            <label class="label">
              Protocol
              <tooltip entry="receiver.protocol" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                {{ protoNames[info.rx_protocol] }}
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal" v-if="receiver_protocol != null">
          <div class="field-label">
            <label class="label">
              Protocol
              <tooltip entry="receiver.protocol" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input-select
                  class="is-fullwidth"
                  v-model.number="receiver_protocol"
                  :options="protocolOptions"
                ></input-select>
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal" v-if="info.quic_protocol_version > 3">
          <div class="field-label">
            <label class="label">
              LQI Source
              <tooltip entry="receiver.lqi_source" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input-select
                  class="is-fullwidth"
                  v-model.number="receiver_lqi_source"
                  :options="lqiSourceNames"
                ></input-select>
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal" v-if="info.quic_protocol_version > 2">
          <div class="field-label">
            <label class="label">
              Bind Saved
              <tooltip entry="receiver.bind_saved" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                {{ bind.info.bind_saved ? "yes" : "no" }}
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal" v-if="info.quic_protocol_version > 2">
          <div class="field-label">
            <label class="label">RSSI</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">{{ state.rx_rssi }}</div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal" v-if="info.quic_protocol_version > 2">
          <div class="field-label">
            <label class="label">Status</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">{{ protoStatus }}</div>
            </div>
          </div>
        </div>

        <div
          class="field is-horizontal"
          v-if="
            info.quic_protocol_version > 2 &&
            rx_protocol == proto.UNIFIED_SERIAL
          "
        >
          <div class="field-label">
            <label class="label">Serial Protocol</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">{{ serialProtoStatus }}</div>
            </div>
          </div>
        </div>

        <div
          class="card mt-4"
          v-if="bind.info.raw && rx_protocol == proto.EXPRESS_LRS"
        >
          <header class="card-header">
            <p class="card-header-title">ExpressLRS</p>
          </header>
          <div class="card-content">
            <div class="content">
              <div class="columns">
                <div class="column is-4">
                  <label>Switch Mode</label>
                </div>
                <div class="column is-8">{{ elrsSwitchMode }}</div>
              </div>
              <div class="columns">
                <div class="column is-4">
                  <label>Current Bind Phrase</label>
                </div>
                <div class="column is-8">{{ elrsBindPhrase }}</div>
              </div>
              <div class="columns">
                <div class="column is-4">
                  <label>New Bind Phrase</label>
                </div>
                <div class="column is-4">
                  <input
                    class="input"
                    id="name"
                    type="text"
                    v-model="elrsBindPhraseInput"
                  />
                </div>
              </div>
              <div class="columns">
                <div class="column is-offset-10 is-2">
                  <button
                    class="button ml-auto mr-1 mt-2"
                    @click="apply_elrs_bind_phrase(elrsBindPhraseInput)"
                    :disabled="elrsBindPhraseInput.length < 4"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card mt-4" v-if="bind.info.raw && isSpiProtocol">
          <header class="card-header">
            <p class="card-header-title">Bind Data</p>
          </header>

          <div class="card-content">
            <div class="content has-text-centered">
              Save and load bind information for spi protocols.<br />
              Requires reboot after load.
            </div>
          </div>

          <footer class="card-footer">
            <button class="card-footer-item button" @click="downloadBindData">
              Save Bind Data
            </button>
            <button class="card-footer-item button" @click="uploadBindData">
              Load Bind Data
            </button>
          </footer>

          <input
            class="input"
            accept=".base64"
            type="file"
            ref="file"
            style="display: none"
          />
          <a ref="downloadAnchor" target="_blank"></a>
        </div>

        <div class="columns mt-4">
          <div class="column is-12 has-text-centered">
            <small>
              Save Bind by moving your right transmitter stick UP-UP-UP followed
              by DOWN-DOWN-DOWN
            </small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapState, mapActions, mapGetters } from "vuex";
import { mapFields } from "@/store/helper.js";
import { $enum } from "ts-enum-util";
import md5 from "md5";

export default defineComponent({
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
    ...mapFields("profile", [
      "receiver.protocol",
      "receiver.lqi_source",
      "meta",
    ]),
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
    rx_protocol() {
      return this.receiver_protocol || this.info.rx_protocol;
    },
    protocolOptions() {
      return (this.info.rx_protocols || [])
        .filter((val) => val > 0)
        .map((val) => {
          return { value: val, text: this.protoNames[val] };
        });
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
        this.proto.FRSKY_D16 || this.proto.FRSKY_D16_FCC,
        this.proto.FRSKY_D16 || this.proto.FRSKY_D16_LBT,
        this.proto.REDPINE,
      ];
      return spi.includes(this.rx_protocol);
    },
    protoStatus() {
      const spi = [
        this.proto.FRSKY_D8,
        this.proto.FRSKY_D16 || this.proto.FRSKY_D16_FCC,
        this.proto.FRSKY_D16 || this.proto.FRSKY_D16_LBT,
        this.proto.REDPINE,
        this.proto.EXPRESS_LRS,
      ];
      if (spi.includes(this.rx_protocol)) {
        const status = [
          "RX_STATUS_NONE",
          "RX_STATUS_BINDING",
          "RX_STATUS_BOUND",
        ];
        return status[this.state.rx_status];
      }
      if (this.rx_protocol == this.proto.UNIFIED_SERIAL) {
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
  watch: {
    receiver_protocol() {
      this.reset();
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
});
</script>
