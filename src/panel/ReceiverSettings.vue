<template>
  <Panel title="Receiver" description="Protocol, link quality, and binding.">
    <div>
      <div>
        <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <label class="text-xs text-muted"
            >Receiver type <tooltip entry="receiver.protocol" /><UiSelect
              v-model.number="profile.receiver.protocol"
              class="mt-1.5"
              :options="protocolOptions"
          /></label>
          <label
            v-if="rx_protocol === RXProtocol.UNIFIED_SERIAL"
            class="text-xs text-muted"
          >
            Serial protocol
            <UiSelect
              :model-value="serialProto"
              class="mt-1.5"
              :options="serialProtoOptions"
              @update:model-value="setSerialProtocol"
            />
          </label>
          <div v-if="hasInvert" class="text-xs text-muted">
            Line
            <Toggle
              class="mt-1.5"
              :model-value="!!profile.receiver.invert"
              label="Inverted"
              help="receiver.invert"
              @update:model-value="profile.receiver.invert = $event ? 1 : 0"
            />
          </div>
          <label class="text-xs text-muted"
            >LQI source <tooltip entry="receiver.lqi_source" /><UiSelect
              v-model.number="profile.receiver.lqi_source"
              class="mt-1.5"
              :options="lqiSourceNames"
          /></label>
          <div
            class="col-span-1 grid grid-cols-2 gap-4 sm:col-span-2 xl:col-span-2"
          >
            <div v-if="hasBindSaved" class="text-xs text-muted">
              Bind saved <tooltip entry="receiver.bind_saved" />
              <p
                class="mt-1.5 py-2 text-sm font-medium"
                :class="bindInfo.bind_saved ? 'text-accent' : 'text-danger'"
              >
                {{ bindInfo.bind_saved ? "Yes" : "No" }}
              </p>
            </div>
            <div class="text-xs text-muted">
              RSSI
              <p
                class="mt-1.5 py-2 text-sm font-medium text-accent tabular-nums"
              >
                {{ state.rx_rssi }}
              </p>
            </div>
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
            <template v-else-if="isSerialProtocol">
              {{
                profile.serial.rx
                  ? serialStatus
                  : "Select a receiver serial port in Setup."
              }}
            </template>
            <template v-else>Binding controls</template>
          </p>
          <div class="flex flex-wrap gap-2">
            <spinner-btn
              v-if="isCrsfProtocol && !serial.radio_link"
              @click="bind.bind_crsf()"
              >Bind receiver</spinner-btn
            >
            <spinner-btn
              v-if="rx_protocol === RXProtocol.DSM && hasFlatProtocols"
              @click="requestDsmBind()"
              >Bind at next power-up</spinner-btn
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
          <Panel
            v-if="bindInfo.raw && rx_protocol == RXProtocol.EXPRESS_LRS"
            title="ExpressLRS"
            class="mt-4"
            ><div class="form-row">
              <span class="form-label">Status</span>
              <div class="min-w-0 flex-1 text-accent">
                {{ protoStatus }}
              </div>
            </div>

            <div class="space-y-4">
              <div class="form-grid">
                <div class="form-row">
                  <span class="form-label">Switch mode</span>
                  <div class="min-w-0 flex-1">
                    {{ elrsSwitchMode }}
                  </div>
                </div>

                <div class="form-row">
                  <span class="form-label">Current bind phrase</span>
                  <div class="min-w-0 flex-1">
                    {{ elrsBindPhrase }}
                  </div>
                </div>

                <div class="form-row">
                  <label for="name" class="form-label">New bind phrase</label>
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
                @click="applyElrsBindPhrase(elrsBindPhraseInput)"
              >
                Apply
              </spinner-btn>
            </footer></Panel
          >

          <Panel
            v-if="bindInfo.raw && isSpiProtocol"
            title="Bind Data"
            class="mt-4"
            ><div class="form-row">
              <span class="form-label">Status</span>
              <div class="min-w-0 flex-1 text-accent">
                {{ protoStatus }}
              </div>
            </div>

            <div class="space-y-4 text-center">
              Save and load bind information for SPI protocols.<br />
              Requires reboot after load.
            </div>

            <footer class="mt-5 flex flex-wrap items-center justify-end gap-2">
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
              style="display: none" />
            <a ref="downloadAnchor" target="_blank"></a
          ></Panel>
        </div>
      </div>
    </div>
  </Panel>
</template>

<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
import Toggle from "@/components/ui/Toggle.vue";
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
import { useSerialStore } from "@/store/serial";

export default defineComponent({
  name: "ReceiverSettings",
  components: { Panel, Toggle },
  setup() {
    return {
      profile: useProfileStore(),
      info: useInfoStore(),
      bind: useBindStore(),
      state: useStateStore(),
      root: useRootStore(),
      serial: useSerialStore(),
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
    // Profile 0.3.1+ selects serial protocols directly instead of through
    // unified serial and keeps bind data without bind_saved.
    hasFlatProtocols() {
      return this.RXProtocol.SERIAL_AUTO !== undefined;
    },
    hasBindSaved() {
      return !this.hasFlatProtocols;
    },
    isSerialProtocol() {
      return (
        this.hasFlatProtocols &&
        this.rx_protocol >= this.RXProtocol.SERIAL_AUTO &&
        this.rx_protocol <= this.RXProtocol.MAVLINK
      );
    },
    hasInvert() {
      return (
        this.hasFlatProtocols &&
        [
          this.RXProtocol.SBUS,
          this.RXProtocol.FPORT,
          this.RXProtocol.REDPINE_SERIAL,
        ].includes(this.rx_protocol)
      );
    },
    serialStatus() {
      const active = this.state.rx_protocol;
      if (active == this.RXProtocol.SERIAL_AUTO) {
        return "Detecting serial protocol";
      }
      if (active == this.RXProtocol.INVALID) {
        return "No receiver active";
      }
      return this.RXProtocol[active] + " active";
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
      if (this.hasFlatProtocols) {
        return (
          this.rx_protocol == this.RXProtocol.SERIAL_AUTO &&
          this.state.rx_protocol == this.RXProtocol.CRSF
        );
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
      if (this.hasBindSaved) info.bind_saved = 1;

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
        if (this.hasBindSaved) info.bind_saved = 1;
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
    requestDsmBind() {
      // Spektrum receivers only accept bind pulses at power-up; the firmware
      // sends them once and clears the request.
      const info = { ...this.bindInfo, raw: new Uint8Array(this.bindInfo.raw) };
      info.raw.fill(0);
      info.raw[0] = 1;

      this.applyBindInfo(info);
      this.root.append_alert({
        type: "success",
        msg: "Apply, then unplug and power up with the receiver connected to bind.",
      });
    },
    reset() {
      const info = { ...this.bindInfo };
      if (this.hasBindSaved) info.bind_saved = 0;
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
