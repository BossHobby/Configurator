<template>
  <div class="min-w-0 rounded-lg border border-line bg-panel text-ink">
    <header
      class="flex items-center justify-between gap-3 px-4 py-3 border-b border-line"
    >
      <p class="text-sm font-semibold">VTX</p>
      <div class="shrink-0 text-muted">
        <span
          class="inline-flex items-center rounded border border-current px-2 py-0.5 text-xs"
          :class="vtxStatusClass"
          >{{ vtxStatusText }}</span
        >
      </div>
    </header>

    <div class="p-4">
      <div class="grid grid-cols-12 gap-4">
        <div class="min-w-0 col-span-12 md:col-span-6">
          <div class="form-row">
            <div class="form-label">
              <label class="text-sm font-medium text-ink">Protocol</label>
            </div>
            <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              <div class="min-w-0 flex-1">
                <div class="min-w-0 flex-1">
                  <input-select
                    id="vtx-protocol"
                    v-model.number="desiredVtx.protocol"
                    :options="vtxProtocolOptions"
                  ></input-select>
                  <p
                    v-if="desiredVtx.protocol == 0"
                    class="mt-1 text-xs text-muted text-warning"
                  >
                    Please select a VTX protocol
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-label">
              <label class="text-sm font-medium text-ink">Detected</label>
            </div>
            <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              <div class="min-w-0 flex-1">
                <div class="min-w-0 flex-1">
                  <template v-if="vtx.status.protocol">
                    <span
                      class="inline-flex items-center rounded border border-current px-2 py-0.5 text-xs text-accent"
                    >
                      {{ protocolNames[vtx.status.protocol] }}
                    </span>
                    <span v-if="detectedFrequency">
                      <span
                        class="inline-flex items-center rounded border border-current px-2 py-0.5 text-xs text-accent ml-2"
                      >
                        {{ detectedFrequency }} MHz
                      </span>
                    </span>
                  </template>
                  <template v-else>
                    <span
                      class="inline-flex items-center rounded border border-current px-2 py-0.5 text-xs text-warning"
                      >Not detected</span
                    >
                  </template>
                </div>
              </div>
            </div>
          </div>

          <template v-if="desiredVtx.protocol">
            <div class="form-row">
              <div class="form-label">
                <label class="text-sm font-medium text-ink">Band</label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0 flex-1">
                    <input-select
                      id="vtx-band"
                      v-model.number="desiredVtx.band"
                      :options="vtxBandOptions"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label">
                <label class="text-sm font-medium text-ink">Channel</label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0 flex-1">
                    <input-select
                      id="vtx-channel"
                      v-model.number="desiredVtx.channel"
                      :options="vtxChannelOptions"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="desiredVtx.pit_mode != 2" class="form-row">
              <div class="form-label">
                <label class="text-sm font-medium text-ink">Pit Mode</label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0 flex-1">
                    <input-select
                      id="vtx-pit-mode"
                      v-model.number="desiredVtx.pit_mode"
                      :options="vtxPitModeOptions"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label">
                <label class="text-sm font-medium text-ink">Power</label>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div class="min-w-0 flex-1">
                  <div class="min-w-0 flex-1">
                    <input-select
                      id="vtx-power-level"
                      v-model.number="desiredVtx.power_level"
                      :options="vtxPowerLevelOptions"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div class="min-w-0 col-span-12 md:col-span-6 md:pl-4">
          <div v-if="desiredVtx.protocol && desiredVtx.power_table">
            <template v-if="desiredPowerTableRows.length">
              <div class="grid grid-cols-12 gap-4 mb-3">
                <div class="min-w-0 col-span-12 md:col-span-2"></div>
                <div class="min-w-0 col-span-12 md:col-span-5">
                  <div class="grid grid-cols-12 gap-4">
                    <div class="min-w-0 col-span-6">
                      <h6>Label</h6>
                    </div>
                    <div class="min-w-0 col-span-6">
                      <h6>Detected</h6>
                    </div>
                  </div>
                </div>
                <div class="min-w-0 col-span-12 md:col-span-5">
                  <div class="grid grid-cols-12 gap-4">
                    <div class="min-w-0 col-span-6">
                      <h6>Value</h6>
                    </div>
                    <div class="min-w-0 col-span-6">
                      <h6>Detected</h6>
                    </div>
                  </div>
                </div>
              </div>
              <div
                v-for="index in desiredPowerTableRows"
                :key="index"
                class="grid grid-cols-12 gap-4 items-center mb-3 last:mb-0"
              >
                <div class="min-w-0 col-span-12 md:col-span-2">
                  <label class="text-sm font-medium text-ink"
                    >Level {{ index + 1 }}</label
                  >
                </div>
                <div class="min-w-0 col-span-12 md:col-span-5">
                  <div class="min-w-0 flex-1 flex items-center gap-2">
                    <div class="min-w-0 flex-1">
                      <input
                        :id="'power-level-label-' + index"
                        v-model.text="desiredVtx.power_table.labels[index]"
                        class="form-input"
                        type="text"
                        maxlength="3"
                        @focus="ensureDesiredPowerTable(index)"
                      />
                    </div>
                    <div class="min-w-0 flex-1">
                      <input
                        :id="'runtime-power-level-label-' + index"
                        class="form-input"
                        type="text"
                        :value="runtimePowerLabel(index)"
                        disabled
                        readonly
                      />
                    </div>
                  </div>
                </div>
                <div class="min-w-0 col-span-12 md:col-span-5">
                  <div class="min-w-0 flex-1 flex items-center gap-2">
                    <div class="min-w-0 flex-1">
                      <input
                        :id="'power-level-value-' + index"
                        v-model.number="desiredVtx.power_table.values[index]"
                        class="form-input"
                        type="number"
                        step="0.1"
                        min="0"
                        :placeholder="detectedPowerValue(index)"
                        @focus="ensureDesiredPowerTable(index)"
                      />
                    </div>
                    <div class="min-w-0 flex-1">
                      <input
                        :id="'runtime-power-level-value-' + index"
                        class="form-input"
                        type="number"
                        :value="detectedPowerValue(index)"
                        disabled
                        readonly
                      />
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <div
              v-if="showLoadDetectedPowerTable"
              class="min-w-0 flex-1 flex flex-wrap gap-3 justify-end"
            >
              <div class="min-w-0">
                <button
                  class="form-button text-xs text-accent"
                  type="button"
                  @click="loadDetectedPowerTable()"
                >
                  Load Detected Power Levels
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <footer
      v-if="isLegacyVtx"
      class="flex flex-wrap items-center justify-end gap-2 border-t border-line p-3"
    >
      <spinner-btn
        class="bg-accent text-on-accent border-transparent"
        @click="applyVtxSettings()"
      >
        Apply
      </spinner-btn>
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useVTXStore } from "@/store/vtx";
import { useInfoStore } from "@/store/info";
import { useProfileStore } from "@/store/profile";

export default defineComponent({
  name: "Vtx",
  setup() {
    return {
      vtx: useVTXStore(),
      info: useInfoStore(),
      profile: useProfileStore(),
    };
  },
  data() {
    return {
      protocolNames: ["INVALID", "TRAMP", "SMARTAUDIO", "MSP_VTX"],
      frequencyTable: [
        [5865, 5845, 5825, 5805, 5785, 5765, 5745, 5725],
        [5733, 5752, 5771, 5790, 5809, 5828, 5847, 5866],
        [5705, 5685, 5665, 5645, 5885, 5905, 5925, 5945],
        [5740, 5760, 5780, 5800, 5820, 5840, 5860, 5880],
        [5658, 5695, 5732, 5769, 5806, 5843, 5880, 5917],
        [5333, 5373, 5413, 5453, 5493, 5533, 5573, 5613],
      ],
    };
  },
  computed: {
    desiredVtx() {
      return this.isLegacyVtx
        ? this.vtx.legacy_settings
        : this.profile.vtx || this.vtx.legacy_settings;
    },
    isLegacyVtx() {
      return !this.info.quic_semver_gte("0.2.9");
    },
    vtxStatusText() {
      return this.vtx.status.protocol ? "Detected" : "Not detected";
    },
    vtxStatusClass() {
      return this.vtx.status.protocol ? "text-accent" : "text-warning";
    },
    displayValueEdit() {
      return this.desiredVtx?.protocol == 1;
    },
    detectedFrequency() {
      if (!this.vtx.status.protocol) {
        return undefined;
      }
      return this.frequencyTable[this.vtx.status.band]?.[
        this.vtx.status.channel
      ];
    },
    showLoadDetectedPowerTable() {
      return (
        this.info.quic_semver_gte("0.2.9") &&
        this.detectedPowerLevelOptions.length > 0
      );
    },
    desiredPowerTableRows() {
      const powerTable = this.desiredVtx?.power_table;
      const levels =
        powerTable?.levels || this.detectedPowerLevelOptions.length;
      if (!levels) {
        return [];
      }
      return Array.from({ length: levels }, (_, index) => index);
    },
    detectedPowerLevelOptions() {
      const powerTable = this.vtx.status.power_table;
      if (!powerTable?.levels) {
        return [];
      }
      return Array.from({ length: powerTable.levels }, (_, index) => {
        const label = powerTable.labels?.[index] || "";
        if (!this.powerLevelIsPopulated(powerTable, index, label)) {
          return undefined;
        }
        return {
          value: index,
          text: this.formatPowerLabel(powerTable, index, label),
        };
      }).filter(Boolean);
    },
    vtxProtocolOptions() {
      const data = [
        //{ value: 0, text: "AUTO" }, we dont do this anymore
        { value: 1, text: "TRAMP" },
        { value: 2, text: "SMARTAUDIO" },
      ];
      if (this.info.quic_semver_gt("0.1.1")) {
        data.push({ value: 3, text: "MSP_VTX" });
      }
      return data;
    },
    vtxBandOptions() {
      const data = [
        { value: 0, text: "VTX_BAND_A" },
        { value: 1, text: "VTX_BAND_B" },
        { value: 2, text: "VTX_BAND_E" },
        { value: 3, text: "VTX_BAND_F" },
        { value: 4, text: "VTX_BAND_R" },
      ];
      if (this.info.quic_semver_gt("0.1.1")) {
        data.push({ value: 5, text: "VTX_BAND_L" });
      }
      return data;
    },
    vtxPowerLevelOptions() {
      const levels =
        this.desiredVtx?.power_table?.levels ||
        this.vtx.status.power_table?.levels;

      if (levels) {
        return Array.from({ length: levels }, (_, index) => {
          return {
            value: index,
            text: this.powerLevelOptionLabel(index),
          };
        });
      }
      const data = [
        { value: 0, text: "VTX_POWER_LEVEL_1" },
        { value: 1, text: "VTX_POWER_LEVEL_2" },
        { value: 2, text: "VTX_POWER_LEVEL_3" },
        { value: 3, text: "VTX_POWER_LEVEL_4" },
      ];
      if (this.info.quic_semver_gt("0.1.1")) {
        data.push({ value: 4, text: "VTX_POWER_LEVEL_5" });
      }
      return data;
    },
    vtxChannelOptions() {
      return [
        { value: 0, text: "VTX_CHANNEL_1" },
        { value: 1, text: "VTX_CHANNEL_2" },
        { value: 2, text: "VTX_CHANNEL_3" },
        { value: 3, text: "VTX_CHANNEL_4" },
        { value: 4, text: "VTX_CHANNEL_5" },
        { value: 5, text: "VTX_CHANNEL_6" },
        { value: 6, text: "VTX_CHANNEL_7" },
        { value: 7, text: "VTX_CHANNEL_8" },
      ];
    },
    vtxPitModeOptions() {
      return [
        { value: 0, text: "Off" },
        { value: 1, text: "On" },
        // { value: 2, text: "NO SUPPORT" }
      ];
    },
  },
  created() {
    this.vtx.update_status(true);
  },
  methods: {
    normalizePowerLabels(vtxSettings) {
      if (!vtxSettings.power_table) {
        return;
      }
      for (let i = 0; i < vtxSettings.power_table.labels.length; i++) {
        while (vtxSettings.power_table.labels[i].length < 3) {
          vtxSettings.power_table.labels[i] += " ";
        }
      }
    },
    applyVtxSettings() {
      this.normalizePowerLabels(this.desiredVtx);
      return this.vtx.apply_legacy_settings(this.desiredVtx);
    },
    loadDetectedPowerTable() {
      if (!this.vtx.status.power_table?.levels) {
        return;
      }

      const power_table = {
        levels: this.detectedPowerLevelOptions.length,
        labels: this.detectedPowerLevelOptions.map((option) =>
          option.text.slice(0, 3),
        ),
        values: this.detectedPowerLevelOptions.map(
          (option) => this.vtx.status.power_table.values[option.value] || 0,
        ),
      };

      if (this.info.quic_semver_gte("0.2.9")) {
        this.profile.vtx = {
          ...this.profile.vtx,
          power_table,
        };
        return;
      }
    },
    ensureDesiredPowerTable(index) {
      const levels = Math.max(
        this.desiredVtx.power_table.levels || 0,
        this.detectedPowerLevelOptions.length,
        index + 1,
      );
      this.desiredVtx.power_table.levels = levels;
      for (let i = 0; i < levels; i++) {
        if (this.desiredVtx.power_table.labels[i] == undefined) {
          this.desiredVtx.power_table.labels[i] = "";
        }
        if (this.desiredVtx.power_table.values[i] == undefined) {
          this.desiredVtx.power_table.values[i] = 0;
        }
      }
    },
    detectedPowerValue(index) {
      return this.vtx.status.power_table.values?.[index] || "";
    },
    runtimePowerLabel(index) {
      const powerTable = this.vtx.status.power_table;
      if (!powerTable?.levels || index >= powerTable.levels) {
        return "";
      }
      return this.formatPowerLabel(
        powerTable,
        index,
        powerTable.labels?.[index] || "",
      );
    },
    powerLevelOptionLabel(index) {
      const profileTable = this.desiredVtx?.power_table;
      const runtimeTable = this.vtx.status.power_table;
      const profileLabel = profileTable?.labels?.[index] || "";
      if (this.powerLevelIsPopulated(profileTable, index, profileLabel)) {
        return this.formatPowerLabel(profileTable, index, profileLabel);
      }
      const runtimeLabel = runtimeTable?.labels?.[index] || "";
      if (this.powerLevelIsPopulated(runtimeTable, index, runtimeLabel)) {
        return this.formatPowerLabel(runtimeTable, index, runtimeLabel);
      }
      return `Power Level ${index + 1}`;
    },
    formatPowerLabel(powerTable, index, label) {
      const text = label.replace(/\0/g, "").trim();
      if (text) {
        return text;
      }
      const value = powerTable.values?.[index];
      return value ? `${value} mW` : `Power Level ${index + 1}`;
    },
    powerLevelIsPopulated(powerTable, index, label) {
      if (!powerTable) {
        return false;
      }
      const text = label.replace(/\0/g, "").trim();
      return Boolean(powerTable.values?.[index] || (text && text !== "0"));
    },
  },
});
</script>
