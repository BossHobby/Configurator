<template>
  <div class="min-w-0 rounded-lg border border-line bg-panel text-ink">
    <header
      class="flex items-center justify-between gap-3 px-4 py-3 border-b border-line"
    >
      <p class="text-sm font-semibold">Receiver</p>
      <spinner-btn class="form-button text-warning" @click="reset"
        >Reset</spinner-btn
      >
    </header>

    <div class="p-4">
      <div class="space-y-4">
        <div
          class="form-row"
          v-if="info.rx_protocol && !profile.receiver.protocol"
        >
          <div class="form-label">
            <label class="text-sm font-medium text-ink">
              Protocol
              <tooltip entry="receiver.protocol" />
            </label>
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">
                {{ protoNames[info.rx_protocol] }}
              </div>
            </div>
          </div>
        </div>

        <div class="form-row" v-if="profile.receiver.protocol">
          <div class="form-label">
            <label class="text-sm font-medium text-ink">
              Protocol
              <tooltip entry="receiver.protocol" />
            </label>
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">
                <input-select
                  class="w-full"
                  v-model.number="profile.receiver.protocol"
                  :options="protocolOptions"
                ></input-select>
              </div>
            </div>
          </div>
        </div>

        <div class="form-row" v-if="info.quic_protocol_version > 3">
          <div class="form-label">
            <label class="text-sm font-medium text-ink">
              LQI Source
              <tooltip entry="receiver.lqi_source" />
            </label>
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">
                <input-select
                  class="w-full"
                  v-model.number="profile.receiver.lqi_source"
                  :options="lqiSourceNames"
                ></input-select>
              </div>
            </div>
          </div>
        </div>

        <div class="form-row" v-if="info.quic_protocol_version > 2">
          <div class="form-label">
            <label class="text-sm font-medium text-ink">
              Bind Saved
              <tooltip entry="receiver.bind_saved" />
            </label>
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">
                {{ bind.info.bind_saved ? "yes" : "no" }}
              </div>
            </div>
          </div>
        </div>

        <div class="form-row" v-if="info.quic_protocol_version > 2">
          <div class="form-label">
            <label class="text-sm font-medium text-ink">RSSI</label>
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">{{ state.rx_rssi }}</div>
            </div>
          </div>
        </div>

        <div class="form-row" v-if="info.quic_protocol_version > 2">
          <div class="form-label">
            <label class="text-sm font-medium text-ink">Status</label>
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">{{ protoStatus }}</div>
            </div>
          </div>
        </div>

        <div
          class="form-row"
          v-if="
            info.quic_protocol_version > 2 &&
            rx_protocol == RXProtocol.UNIFIED_SERIAL
          "
        >
          <div class="form-label">
            <label class="text-sm font-medium text-ink">Serial Protocol</label>
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0 flex-1">{{ serialProtoStatus }}</div>
            </div>
          </div>
        </div>

        <div
          class="min-w-0 rounded-lg border border-line bg-panel text-ink mt-4"
          v-if="bind.info.raw && rx_protocol == RXProtocol.EXPRESS_LRS"
        >
          <header
            class="flex items-center justify-between gap-3 px-4 py-3 border-b border-line"
          >
            <p class="text-sm font-semibold">ExpressLRS</p>
          </header>
          <div class="p-4">
            <div class="space-y-4">
              <div class="form-row">
                <div class="form-label">
                  <label class="text-sm font-medium text-ink"
                    >Switch Mode</label
                  >
                </div>
                <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="min-w-0 flex-1">{{ elrsSwitchMode }}</div>
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-label">
                  <label class="text-sm font-medium text-ink"
                    >Current Bind Phrase</label
                  >
                </div>
                <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="min-w-0 flex-1">{{ elrsBindPhrase }}</div>
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-label">
                  <label class="text-sm font-medium text-ink"
                    >New Bind Phrase</label
                  >
                </div>
                <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="min-w-0 flex-1">
                      <input
                        class="form-input"
                        id="name"
                        type="text"
                        v-model="elrsBindPhraseInput"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer
            class="flex flex-wrap items-center justify-end gap-2 border-t border-line p-3"
          >
            <spinner-btn
              @click="apply_elrs_bind_phrase(elrsBindPhraseInput)"
              :disabled="elrsBindPhraseInput.length < 2"
            >
              Apply
            </spinner-btn>
          </footer>
        </div>

        <div
          class="min-w-0 rounded-lg border border-line bg-panel text-ink mt-4"
          v-if="bind.info.raw && isSpiProtocol"
        >
          <header
            class="flex items-center justify-between gap-3 px-4 py-3 border-b border-line"
          >
            <p class="text-sm font-semibold">Bind Data</p>
          </header>

          <div class="p-4">
            <div class="space-y-4 text-center">
              Save and load bind information for spi protocols.<br />
              Requires reboot after load.
            </div>
          </div>

          <footer
            class="flex flex-wrap items-center justify-end gap-2 border-t border-line p-3"
          >
            <spinner-btn @click="downloadBindData">
              Save Bind Data
            </spinner-btn>
            <spinner-btn @click="uploadBindData"> Load Bind Data </spinner-btn>
          </footer>

          <input
            class="form-input"
            accept=".base64"
            type="file"
            ref="file"
            style="display: none"
          />
          <a ref="downloadAnchor" target="_blank"></a>
        </div>

        <div class="grid grid-cols-12 gap-4 mt-4">
          <div class="min-w-0 text-center col-span-12 md:col-span-12">
            <small>
              When binding via your transmitter, save bind by moving your right
              transmitter stick UP-UP-UP followed by DOWN-DOWN-DOWN, to toggle
              the Bind Saved flag above. When binding via passphrase or bind
              data this is not required.
            </small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { $enum } from "ts-enum-util";
import md5 from "md5";
import { useInfoStore } from "@/store/info";
import { useProfileStore } from "@/store/profile";
import { useConstantStore } from "@/store/constants";
import { mapState } from "pinia";
import { useBindStore } from "@/store/bind";
import { useStateStore } from "@/store/state";
import { useRootStore } from "@/store/root";

export default defineComponent({
  name: "ReceiverSettingsLegacy",
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
  setup() {
    return {
      profile: useProfileStore(),
      info: useInfoStore(),
      bind: useBindStore(),
      state: useStateStore(),
      root: useRootStore(),
    };
  },
  computed: {
    ...mapState(useConstantStore, {
      serialProtoNames: (state) => $enum(state.RXSerialProtocol).getKeys(),
      RXProtocol: (state) => state.RXProtocol as any,
    }),
    date() {
      return new Date(this.profile.meta.datetime * 1000);
    },
    protoNames() {
      return $enum(this.RXProtocol).getKeys();
    },
    rx_protocol() {
      return this.profile.receiver.protocol || this.info.rx_protocol;
    },
    protocolOptions() {
      return (this.info.rx_protocols || [])
        .filter((val) => val > 0)
        .map((val) => {
          return { value: val, text: this.protoNames[val] };
        });
    },
    serialProto() {
      return this.serialProtoNames.reduce((m, v, i) => {
        m[v] = i;
        return m;
      }, {});
    },
    isSpiProtocol() {
      const spi = [
        this.RXProtocol.FRSKY_D8,
        this.RXProtocol.FRSKY_D16 || this.RXProtocol.FRSKY_D16_FCC,
        this.RXProtocol.FRSKY_D16 || this.RXProtocol.FRSKY_D16_LBT,
        this.RXProtocol.REDPINE,
        this.RXProtocol.FLYSKY_AFHDS,
        this.RXProtocol.FLYSKY_AFHDS2A,
      ];
      return spi.includes(this.rx_protocol);
    },
    protoStatus() {
      const spi = [
        this.RXProtocol.FRSKY_D8,
        this.RXProtocol.FRSKY_D16 || this.RXProtocol.FRSKY_D16_FCC,
        this.RXProtocol.FRSKY_D16 || this.RXProtocol.FRSKY_D16_LBT,
        this.RXProtocol.REDPINE,
        this.RXProtocol.EXPRESS_LRS,
        this.RXProtocol.FLYSKY_AFHDS,
        this.RXProtocol.FLYSKY_AFHDS2A,
      ];
      if (spi.includes(this.rx_protocol)) {
        const status = [
          "RX_STATUS_NONE",
          "RX_STATUS_BINDING",
          "RX_STATUS_BOUND",
        ];
        return status[this.state.rx_status];
      }
      if (this.rx_protocol == this.RXProtocol.UNIFIED_SERIAL) {
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
      let index = 0;

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
      return this.bind?.info?.raw[8] ? "Hybrid Switches" : "Wide Switches";
    },
    downloadAnchor() {
      return this.$refs.downloadAnchor as HTMLAnchorElement;
    },
    fileRef() {
      return this.$refs.file as HTMLInputElement;
    },
  },
  watch: {
    "profile.receiver.protocol"() {
      this.reset();
    },
  },
  methods: {
    async applyBindInfo(info: any) {
      await this.profile.apply_profile(this.profile.$state);
      await this.bind.apply_bind_info(info);
    },
    parseHexString(str: string) {
      const result = [] as number[];
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

      return this.applyBindInfo(info);
    },
    downloadBindData() {
      const base64 = window.btoa(
        String.fromCharCode(...new Uint8Array(this.bind.info.raw)),
      );
      const encoded = encodeURIComponent(base64);
      const json = "data:application/octet-stream;charset=utf-8," + encoded;

      const date = this.date.toISOString().substring(0, 10);
      const name = this.profile.meta.name.replace(/\0/g, "");
      const filename = `BindData_${name}_${date}.base64`;

      this.downloadAnchor.setAttribute("href", json);
      this.downloadAnchor.setAttribute("download", filename);
      this.downloadAnchor.click();
    },
    uploadBindData() {
      const reader = new FileReader();
      reader.addEventListener("load", (event) => {
        const info = { ...this.bind?.info };
        info.bind_saved = 1;
        info.raw = Uint8Array.from(
          window.atob(event?.target?.result as string),
          (c) => c.charCodeAt(0),
        );

        this.applyBindInfo(info);
      });

      this.fileRef.oninput = () => {
        if (this.fileRef?.files?.length) {
          reader.readAsText(this.fileRef.files[0]);
        }
      };

      this.fileRef.click();
    },
    reset() {
      const info = { ...this.bind?.info };
      info.bind_saved = 0;
      for (let i = 0; i < info.raw.length; i++) {
        info.raw[i] = 0;
      }

      return this.applyBindInfo(info);
    },
  },
});
</script>
