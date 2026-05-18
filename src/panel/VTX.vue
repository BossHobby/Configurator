<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">VTX</p>
      <div class="card-header-icon">
        <span class="tag" :class="vtxStatusClass">{{ vtxStatusText }}</span>
      </div>
    </header>

    <div class="card-content">
      <div class="columns">
        <div class="column field-is-3">
          <div class="field is-horizontal">
            <div class="field-label">
              <label class="label">Protocol</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control is-expanded">
                  <input-select
                    id="vtx-protocol"
                    v-model.number="desiredVtx.protocol"
                    :options="vtxProtocolOptions"
                  ></input-select>
                  <p v-if="desiredVtx.protocol == 0" class="help is-warning">
                    Please select a VTX protocol
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="field is-horizontal">
            <div class="field-label">
              <label class="label">Detected</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control is-expanded">
                  <template v-if="vtx.status.protocol">
                    <span class="tag is-medium is-success">
                      {{ protocolNames[vtx.status.protocol] }}
                    </span>
                    <span v-if="detectedFrequency">
                      <span class="tag is-medium is-info ml-2">
                        {{ detectedFrequency }} MHz
                      </span>
                    </span>
                  </template>
                  <template v-else>
                    <span class="tag is-medium is-warning">Not detected</span>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <template v-if="desiredVtx.protocol">
            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label">Band</label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      id="vtx-band"
                      v-model.number="desiredVtx.band"
                      :options="vtxBandOptions"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label">Channel</label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      id="vtx-channel"
                      v-model.number="desiredVtx.channel"
                      :options="vtxChannelOptions"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="desiredVtx.pit_mode != 2" class="field is-horizontal">
              <div class="field-label">
                <label class="label">Pit Mode</label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      id="vtx-pit-mode"
                      v-model.number="desiredVtx.pit_mode"
                      :options="vtxPitModeOptions"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>

            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label">Power</label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
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

        <div class="column">
          <div v-if="desiredVtx.protocol && desiredVtx.power_table">
            <template v-if="desiredPowerTableRows.length">
              <div class="columns">
                <div class="column is-2"></div>
                <div class="column is-5">
                  <div class="columns is-mobile">
                    <div class="column">
                      <h6>Label</h6>
                    </div>
                    <div class="column">
                      <h6>Detected</h6>
                    </div>
                  </div>
                </div>
                <div class="column is-5">
                  <div class="columns is-mobile">
                    <div class="column">
                      <h6>Value</h6>
                    </div>
                    <div class="column">
                      <h6>Detected</h6>
                    </div>
                  </div>
                </div>
              </div>
              <div
                v-for="index in desiredPowerTableRows"
                :key="index"
                class="columns is-vcentered"
              >
                <div class="column is-2">
                  <label class="label">Level {{ index + 1 }}</label>
                </div>
                <div class="column is-5">
                  <div class="field has-addons">
                    <div class="control is-expanded">
                      <input
                        :id="'power-level-label-' + index"
                        v-model.text="desiredVtx.power_table.labels[index]"
                        class="input"
                        type="text"
                        maxlength="3"
                        @focus="ensureDesiredPowerTable(index)"
                      />
                    </div>
                    <div class="control is-expanded">
                      <input
                        :id="'runtime-power-level-label-' + index"
                        class="input"
                        type="text"
                        :value="runtimePowerLabel(index)"
                        disabled
                        readonly
                      />
                    </div>
                  </div>
                </div>
                <div class="column is-5">
                  <div class="field has-addons">
                    <div class="control is-expanded">
                      <input
                        :id="'power-level-value-' + index"
                        v-model.number="desiredVtx.power_table.values[index]"
                        class="input"
                        type="number"
                        step="0.1"
                        min="0"
                        :placeholder="detectedPowerValue(index)"
                        @focus="ensureDesiredPowerTable(index)"
                      />
                    </div>
                    <div class="control is-expanded">
                      <input
                        :id="'runtime-power-level-value-' + index"
                        class="input"
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
              class="field is-grouped is-justify-content-flex-end"
            >
              <div class="control">
                <button
                  class="button is-small is-info is-light"
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

    <footer v-if="isLegacyVtx" class="card-footer">
      <span class="card-footer-item"></span>
      <spinner-btn
        class="card-footer-item is-primary"
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
      return this.vtx.status.protocol ? "is-success" : "is-warning";
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
