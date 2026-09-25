<template>
  <div class="min-w-0 rounded-lg border border-line bg-panel text-ink">
    <div class="p-4">
      <div>
        <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <label class="text-xs text-muted"
            >Receiver type <tooltip entry="receiver.protocol" /><input-select
              v-model.number="profile.receiver.protocol"
              class="mt-1.5"
              :options="protocolOptions"
          /></label>
          <label
            v-if="rx_protocol === RXProtocol.UNIFIED_SERIAL"
            class="text-xs text-muted"
          >
            Serial protocol
            <input-select
              :model-value="serialProto"
              class="mt-1.5"
              :options="serialProtoOptions"
              @update:model-value="setSerialProtocol"
            />
          </label>
          <label class="text-xs text-muted"
            >LQI source <tooltip entry="receiver.lqi_source" /><input-select
              v-model.number="profile.receiver.lqi_source"
              class="mt-1.5"
              :options="lqiSourceNames"
          /></label>
          <div class="text-xs text-muted">
            Bind saved <tooltip entry="receiver.bind_saved" />
            <p
              class="mt-1.5 rounded-md border border-line bg-subtle px-3 py-2 text-sm text-ink"
            >
              {{ bindInfo.bind_saved ? "Yes" : "No" }}
            </p>
          </div>
          <div class="text-xs text-muted">
            RSSI
            <p
              class="mt-1.5 rounded-md border border-line bg-subtle px-3 py-2 text-sm text-ink"
            >
              {{ state.rx_rssi }}
            </p>
          </div>
        </div>

        <div
          class="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3"
        >
          <p class="text-sm text-muted">
            <template v-if="rx_protocol === RXProtocol.UNIFIED_SERIAL">
              {{
                profile.serial.rx
                  ? serialProtoStatus
                  : "Select a receiver serial port in Setup."
              }}
            </template>
            <template v-else>Binding controls</template>
          </p>
          <div class="flex flex-wrap gap-2">
            <spinner-btn v-if="isCrsfProtocol" @click="bind.bind_crsf()"
              >Bind receiver</spinner-btn
            >
            <spinner-btn
              v-if="
                isLegacyBindInfo && rx_protocol === RXProtocol.UNIFIED_SERIAL
              "
              @click="applySerialBindInfo()"
              >Apply serial protocol</spinner-btn
            >
            <spinner-btn @click="reset">Reset binding</spinner-btn>
          </div>
        </div>
        <div>
          <div
            v-if="bindInfo.raw && rx_protocol == RXProtocol.EXPRESS_LRS"
            class="min-w-0 rounded-lg border border-line bg-panel text-ink mt-4"
          >
            <header
              class="flex items-center justify-between gap-3 px-4 py-3 border-b border-line"
            >
              <p class="text-sm font-semibold">ExpressLRS</p>
            </header>
            <div class="p-4">
              <div class="form-row">
                <div class="form-label">
                  <label class="text-sm font-medium text-ink">Status</label>
                </div>
                <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="min-w-0 flex-1">{{ protoStatus }}</div>
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                <div class="form-row">
                  <div class="form-label">
                    <label class="text-sm font-medium text-ink"
                      >Switch mode</label
                    >
                  </div>
                  <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                    <div class="min-w-0 flex-1">
                      <div class="min-w-0 flex-1">
                        {{ elrsSwitchMode }}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-label">
                    <label class="text-sm font-medium text-ink"
                      >Current bind phrase</label
                    >
                  </div>
                  <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                    <div class="min-w-0 flex-1">
                      <div class="min-w-0 flex-1">
                        {{ elrsBindPhrase }}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-label">
                    <label class="text-sm font-medium text-ink"
                      >New bind phrase</label
                    >
                  </div>
                  <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                    <div class="min-w-0 flex-1">
                      <div class="min-w-0 flex-1">
                        <input
                          id="name"
                          v-model="elrsBindPhraseInput"
                          class="form-input"
                          type="text"
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
                :disabled="elrsBindPhraseInput.length < 2"
                @click="applyElrsBindPhrase(elrsBindPhraseInput)"
              >
                Apply
              </spinner-btn>
            </footer>
          </div>

          <div
            v-if="bindInfo.raw && isSpiProtocol"
            class="min-w-0 rounded-lg border border-line bg-panel text-ink mt-4"
          >
            <header
              class="flex items-center justify-between gap-3 px-4 py-3 border-b border-line"
            >
              <p class="text-sm font-semibold">Bind Data</p>
            </header>

            <div class="p-4">
              <div class="form-row">
                <div class="form-label">
                  <label class="text-sm font-medium text-ink">Status</label>
                </div>
                <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="min-w-0 flex-1">{{ protoStatus }}</div>
                  </div>
                </div>
              </div>

              <div class="space-y-4 text-center">
                Save and load bind information for SPI protocols.<br />
                Requires reboot after load.
              </div>
            </div>

            <footer
              class="flex flex-wrap items-center justify-end gap-2 border-t border-line p-3"
            >
              <spinner-btn @click="downloadBindData">
                Save bind data
              </spinner-btn>
              <spinner-btn @click="uploadBindData">
                Load bind data
              </spinner-btn>
            </footer>

            <input
              ref="file"
              class="form-input"
              accept=".base64"
              type="file"
              style="display: none"
            />
            <a ref="downloadAnchor" target="_blank"></a>
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
  name: "ReceiverSettings",
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
      serialProto: 0,
      elrsBindPhraseInput: "",
    };
  },
  computed: {
    ...mapState(useConstantStore, {
      serialProtoNames: (state) => $enum(state.RXSerialProtocol).getKeys(),
      serialProtoOptions: (state) =>
        $enum(state.RXSerialProtocol)
          .getKeys()
          .map((v, i) => ({ value: i, text: i == 0 ? "AUTO" : v })),
      RXProtocol: (state) => state.RXProtocol as any,
      protoNames: (state) => $enum(state.RXProtocol).getKeys(),
      lqiSourceNames: (state) =>
        $enum(state.LQISource)
          .getKeys()
          .map((v, i) => ({ value: i, text: v })),
    }),
    date() {
      return new Date(this.profile.meta.datetime * 1000);
    },
    rx_protocol() {
      return this.profile.receiver.protocol || this.info.rx_protocol;
    },
    isLegacyBindInfo() {
      return !this.info.quic_semver_gte("0.2.9");
    },
    bindInfo() {
      return this.isLegacyBindInfo
        ? this.bind.info
        : this.profile.receiver.bind || this.bind.info;
    },
    protocolOptions() {
      return (this.info.rx_protocols || [])
        .filter((val) => val > 0)
        .map((val) => {
          return { value: val, text: this.protoNames[val] };
        });
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
    isCrsfProtocol() {
      if (this.rx_protocol == this.RXProtocol.CRSF) {
        return true;
      }

      if (this.rx_protocol != this.RXProtocol.UNIFIED_SERIAL) {
        return false;
      }

      const crsf = this.serialProtoNames.indexOf("CRSF");
      if (this.serialProto == crsf) {
        return true;
      }

      return this.state.rx_status == 200 + crsf;
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
      return "";
    },
    serialProtoStatus() {
      let index = 0;
      if (this.state.rx_status >= 100 && this.state.rx_status < 200) {
        index = this.state.rx_status - 100;
      } else if (this.state.rx_status >= 200 && this.state.rx_status < 300) {
        index = this.state.rx_status - 200;
      }

      if (this.state.rx_status >= 200 && this.state.rx_status < 300) {
        return this.serialProtoNames[index] + " detected";
      }
      return "trying " + this.serialProtoNames[index];
    },
    elrsBindPhrase() {
      return this.bindInfo?.raw?.slice(1, 7).join(", ");
    },
    elrsSwitchMode() {
      return this.bindInfo?.raw[8] ? "Hybrid Switches" : "Wide Switches";
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
  async created() {
    if (this.isLegacyBindInfo) {
      await this.bind.fetch_bind_info();
    }

    if (this.rx_protocol == this.RXProtocol.UNIFIED_SERIAL) {
      this.serialProto = this.bindInfo.raw?.[0] ?? 0;
      if (this.serialProto == 0 && this.state.rx_status >= 200) {
        this.serialProto = this.state.rx_status - 200;
      }
    }
  },
  methods: {
    setSerialProtocol(value: number) {
      this.serialProto = value;
      if (
        !this.isLegacyBindInfo &&
        this.rx_protocol == this.RXProtocol.UNIFIED_SERIAL
      ) {
        return this.applySerialBindInfo();
      }
    },
    async applyBindInfo(info: any) {
      if (this.isLegacyBindInfo) {
        await this.profile.apply_profile(this.profile.$state);
        await this.bind.apply_bind_info(info);
        return;
      }

      this.profile.receiver.bind = info;
      this.root.set_needs_reboot();
    },
    parseHexString(str: string) {
      const result = [] as number[];
      while (str.length >= 2) {
        result.push(parseInt(str.substring(0, 2), 16));
        str = str.substring(2, str.length);
      }
      return result;
    },
    applyElrsBindPhrase(input) {
      const hex = md5(`-DMY_BINDING_PHRASE="${input}"`);
      const bytes = this.parseHexString(hex).slice(0, 6);

      const info = { ...this.bindInfo };
      info.bind_saved = 1;

      info.raw[0] = 1;
      for (let i = 0; i < 6; i++) {
        info.raw[i + 1] = bytes[i];
      }
      info.raw[7] = 0x37;

      return this.applyBindInfo(info);
    },
    applySerialBindInfo() {
      if (this.serialProto == 0 && this.state.rx_status >= 200) {
        this.serialProto = this.state.rx_status - 200;
      }

      const proto = this.serialProto;
      const info = { ...this.bindInfo };
      for (let i = 0; i < info.raw.length; i++) {
        info.raw[i] = 0;
      }
      info.bind_saved = proto > 0 ? 1 : 0;
      info.raw[0] = proto;

      return this.applyBindInfo(info);
    },
    downloadBindData() {
      const base64 = window.btoa(
        String.fromCharCode(...new Uint8Array(this.bindInfo.raw)),
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
        const info = { ...this.bindInfo };
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
      const info = { ...this.bindInfo };
      info.bind_saved = 0;
      for (let i = 0; i < info.raw.length; i++) {
        info.raw[i] = 0;
      }

      this.serialProto = 0;
      this.elrsBindPhraseInput = "";

      return this.applyBindInfo(info);
    },
  },
});
</script>
