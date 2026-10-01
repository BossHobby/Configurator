<template>
  <Panel title="VTX"
    ><template #actions
      ><div class="shrink-0 text-muted">
        <span
          class="inline-flex items-center rounded border border-current px-2 py-0.5 text-xs"
          :class="vtxStatusClass"
          >{{ vtxStatusText }}</span
        >
      </div></template
    >
    <div class="grid grid-cols-12 gap-4">
      <div class="min-w-0 col-span-12 md:col-span-6">
        <div class="form-grid grid-cols-2">
          <div class="form-row">
            <label for="vtx-protocol" class="form-label"
              >Protocol <tooltip entry="vtx.protocol"
            /></label>
            <div class="min-w-0 flex-1">
              <UiSelect
                id="vtx-protocol"
                v-model.number="desiredVtx.protocol"
                :options="vtxProtocolOptions"
              ></UiSelect>
              <p v-if="desiredVtx.protocol == 0" class="text-xs text-warning">
                Please select a VTX protocol
              </p>
            </div>
          </div>

          <div class="form-row">
            <span class="form-label"
              >Detected <tooltip entry="vtx.detected"
            /></span>
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

        <template v-if="desiredVtx.protocol">
          <div class="form-grid grid-cols-2">
            <div class="form-row">
              <label for="vtx-band" class="form-label"
                >Band <tooltip entry="vtx.band"
              /></label>
              <UiSelect
                id="vtx-band"
                v-model.number="desiredVtx.band"
                :options="vtxBandOptions"
              ></UiSelect>
            </div>

            <div class="form-row">
              <label for="vtx-channel" class="form-label"
                >Channel <tooltip entry="vtx.channel"
              /></label>
              <UiSelect
                id="vtx-channel"
                v-model.number="desiredVtx.channel"
                :options="vtxChannelOptions"
              ></UiSelect>
            </div>

            <div v-if="desiredVtx.pit_mode != 2" class="form-row">
              <label for="vtx-pit-mode" class="form-label"
                >Pit Mode <tooltip entry="vtx.pit_mode"
              /></label>
              <UiSelect
                id="vtx-pit-mode"
                v-model.number="desiredVtx.pit_mode"
                :options="vtxPitModeOptions"
              ></UiSelect>
            </div>

            <div class="form-row">
              <label for="vtx-power-level" class="form-label"
                >Power <tooltip entry="vtx.power_level"
              /></label>
              <UiSelect
                id="vtx-power-level"
                v-model.number="desiredVtx.power_level"
                :options="vtxPowerLevelOptions"
              ></UiSelect>
            </div>
          </div>
        </template>
      </div>

      <div class="min-w-0 col-span-12 md:col-span-6 md:pl-4">
        <div v-if="desiredVtx.protocol && desiredVtx.power_table">
          <template v-if="desiredPowerTableRows.length">
            <table class="data-table">
              <thead>
                <tr>
                  <th scope="col">Level</th>
                  <th scope="col">Label</th>
                  <th scope="col">Detected</th>
                  <th scope="col">Value</th>
                  <th scope="col">Detected</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="index in desiredPowerTableRows" :key="index">
                  <th scope="row" class="w-14">{{ index + 1 }}</th>
                  <td>
                    <input
                      v-model.text="desiredVtx.power_table.labels[index]"
                      :aria-label="`Level ${index + 1} label`"
                      class="form-input"
                      type="text"
                      maxlength="3"
                      @focus="ensureDesiredPowerTable(index)"
                    />
                  </td>
                  <td class="text-muted">
                    {{ runtimePowerLabel(index) || "–" }}
                  </td>
                  <td>
                    <input
                      v-model.number="desiredVtx.power_table.values[index]"
                      :aria-label="`Level ${index + 1} value`"
                      class="form-input"
                      type="number"
                      step="0.1"
                      min="0"
                      :placeholder="detectedPowerValue(index)"
                      @focus="ensureDesiredPowerTable(index)"
                    />
                  </td>
                  <td class="text-muted">
                    {{ detectedPowerValue(index) ?? "–" }}
                  </td>
                </tr>
              </tbody>
            </table>
          </template>

          <div v-if="showLoadDetectedPowerTable" class="mt-3 flex justify-end">
            <button
              class="form-button"
              type="button"
              @click="loadDetectedPowerTable()"
            >
              Load detected power levels
            </button>
          </div>
        </div>
      </div>
    </div>

    <footer
      v-if="isLegacyVtx"
      class="mt-5 flex flex-wrap items-center justify-end gap-2"
    >
      <spinner-btn variant="primary" @click="applyVtxSettings()">
        Apply
      </spinner-btn>
    </footer></Panel
  >
</template>

<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
import { defineComponent } from "vue";
import { useVTXStore } from "@/store/vtx";
import { useInfoStore } from "@/store/info";
import { useProfileStore } from "@/store/profile";

export default defineComponent({
  name: "Vtx",
  components: { Panel },
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
