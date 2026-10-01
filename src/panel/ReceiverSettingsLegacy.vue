<template>
  <Panel title="Receiver"
    ><template #actions
      ><spinner-btn @click="reset">Reset</spinner-btn></template
    >
    <div class="space-y-4">
      <div class="form-grid">
        <div
          v-if="info.rx_protocol && !profile.receiver.protocol"
          class="form-row"
        >
          <span class="form-label">
            Protocol
            <tooltip entry="receiver.protocol"
          /></span>
          <div class="min-w-0 flex-1">
            {{ protoNames[info.rx_protocol] }}
          </div>
        </div>

        <div v-if="profile.receiver.protocol" class="form-row">
          <label for="receiver-settings-legacy-protocol" class="form-label">
            Protocol
            <tooltip entry="receiver.protocol"
          /></label>
          <UiSelect
            id="receiver-settings-legacy-protocol"
            v-model.number="profile.receiver.protocol"
            class="w-full"
            :options="protocolOptions"
          ></UiSelect>
        </div>

        <div v-if="info.quic_protocol_version > 3" class="form-row">
          <label for="receiver-settings-legacy-lqi-source" class="form-label">
            LQI Source
            <tooltip entry="receiver.lqi_source"
          /></label>
          <UiSelect
            id="receiver-settings-legacy-lqi-source"
            v-model.number="profile.receiver.lqi_source"
            class="w-full"
            :options="lqiSourceNames"
          ></UiSelect>
        </div>

        <div v-if="info.quic_protocol_version > 2" class="form-row">
          <span class="form-label">
            Bind Saved
            <tooltip entry="receiver.bind_saved"
          /></span>
          <div class="min-w-0 flex-1">
            {{ bind.info.bind_saved ? "yes" : "no" }}
          </div>
        </div>

        <div v-if="info.quic_protocol_version > 2" class="form-row">
          <span class="form-label">RSSI</span>
          <div class="min-w-0 flex-1">{{ state.rx_rssi }}</div>
        </div>

        <div v-if="info.quic_protocol_version > 2" class="form-row">
          <span class="form-label">Status</span>
          <div class="min-w-0 flex-1 text-accent">
            {{ protoStatus }}
          </div>
        </div>

        <div
          v-if="
            info.quic_protocol_version > 2 &&
            rx_protocol == RXProtocol.UNIFIED_SERIAL
          "
          class="form-row"
        >
          <span class="form-label">Serial Protocol</span>
          <div class="min-w-0 flex-1 text-accent">
            {{ serialProtoStatus }}
          </div>
        </div>
      </div>

      <Panel
        v-if="bind.info.raw && rx_protocol == RXProtocol.EXPRESS_LRS"
        title="ExpressLRS"
        class="mt-4"
        ><div class="space-y-4">
          <div class="form-grid">
            <div class="form-row">
              <span class="form-label">Switch Mode</span>
              <div class="min-w-0 flex-1">{{ elrsSwitchMode }}</div>
            </div>

            <div class="form-row">
              <span class="form-label">Current Bind Phrase</span>
              <div class="min-w-0 flex-1">{{ elrsBindPhrase }}</div>
            </div>

            <div class="form-row">
              <label for="name" class="form-label">New Bind Phrase</label>
              <input
                id="name"
                v-model="elrsBindPhraseInput"
                class="form-input"
                type="text"
              />
            </div>
          </div>
        </div>

        <footer class="mt-5 flex flex-wrap items-center justify-end gap-2">
          <spinner-btn
            :disabled="elrsBindPhraseInput.length < 2"
            @click="apply_elrs_bind_phrase(elrsBindPhraseInput)"
          >
            Apply
          </spinner-btn>
        </footer></Panel
      >

      <Panel
        v-if="bind.info.raw && isSpiProtocol"
        title="Bind Data"
        class="mt-4"
        ><div class="space-y-4 text-center">
          Save and load bind information for spi protocols.<br />
          Requires reboot after load.
        </div>

        <footer class="mt-5 flex flex-wrap items-center justify-end gap-2">
          <spinner-btn @click="downloadBindData"> Save Bind Data </spinner-btn>
          <spinner-btn @click="uploadBindData"> Load Bind Data </spinner-btn>
        </footer>

        <input
          ref="file"
          class="form-input"
          accept=".base64"
          type="file"
          style="display: none" />
        <a ref="downloadAnchor" target="_blank"></a
      ></Panel>

      <div class="grid grid-cols-12 gap-4 mt-4">
        <div class="min-w-0 text-center col-span-12 md:col-span-12">
          <small>
            When binding via your transmitter, save bind by moving your right
            transmitter stick UP-UP-UP followed by DOWN-DOWN-DOWN, to toggle the
            Bind Saved flag above. When binding via passphrase or bind data this
            is not required.
          </small>
        </div>
      </div>
    </div></Panel
  >
</template>

<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
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
  components: { Panel },
  setup() {
    return {
      profile: useProfileStore(),
      info: useInfoStore(),
      bind: useBindStore(),
      state: useStateStore(),
      root: useRootStore(),
    };
  },
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
