<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">VTX</p>
    </header>

    <div class="card-content">
      <div class="content column-narrow field-is-3">
        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">Protocol</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input-select
                  id="vtx-protocol"
                  v-model.number="vtx.settings.protocol"
                  :options="vtxProtocolOptions"
                ></input-select>
              </div>
            </div>
          </div>
        </div>

        <template v-if="vtx.settings.detected">
          <div class="field is-horizontal">
            <div class="field-label">
              <label class="label">Frequency</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control is-expanded">
                  {{ frequencyTable[vtx.settings.band][vtx.settings.channel] }}
                </div>
              </div>
            </div>
          </div>

          <div class="field is-horizontal">
            <div class="field-label">
              <label class="label">Band</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control is-expanded">
                  <input-select
                    id="vtx-band"
                    v-model.number="vtx.settings.band"
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
                    v-model.number="vtx.settings.channel"
                    :options="vtxChannelOptions"
                  ></input-select>
                </div>
              </div>
            </div>
          </div>

          <div class="field is-horizontal" v-if="vtx.settings.pit_mode != 2">
            <div class="field-label">
              <label class="label">Pit Mode</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control is-expanded">
                  <input-select
                    id="vtx-pit-mode"
                    v-model.number="vtx.settings.pit_mode"
                    :options="vtxPitModeOptions"
                  ></input-select>
                </div>
              </div>
            </div>
          </div>

          <div class="field is-horizontal">
            <div class="field-label">
              <label class="label">Power Level</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control is-expanded">
                  <input-select
                    id="vtx-power-level"
                    v-model.number="vtx.settings.power_level"
                    :options="vtxPowerLevelOptions"
                  ></input-select>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="is-size-5 has-text-centered has-text-weight-semibold">
            Not detected
          </div>
        </template>
      </div>
    </div>

    <footer class="card-footer">
      <spinner-btn class="card-footer-item" @click="vtx.apply_vtx_settings(vtx.settings)">
        Apply
      </spinner-btn>
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useVTXStore } from "@/store/vtx";
import { useInfoStore } from "@/store/info";

export default defineComponent({
  name: "vtx",
  setup() {
    return {
      vtx: useVTXStore(),
      info: useInfoStore(),
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
    vtxProtocolOptions() {
      const data = [
        { value: 0, text: "AUTO" },
        { value: 1, text: "TRAMP" },
        { value: 2, text: "SMARTAUDIO" },
      ];
      if (this.info.quicVersionGt("0.1.1")) {
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
      if (this.info.quicVersionGt("0.1.1")) {
        data.push({ value: 5, text: "VTX_BAND_L" });
      }
      return data;
    },
    vtxPowerLevelOptions() {
      const data = [
        { value: 0, text: "VTX_POWER_LEVEL_1" },
        { value: 1, text: "VTX_POWER_LEVEL_2" },
        { value: 2, text: "VTX_POWER_LEVEL_3" },
        { value: 3, text: "VTX_POWER_LEVEL_4" },
      ];
      if (this.info.quicVersionGt("0.1.1")) {
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
    this.vtx.update_vtx_settings(true);
  },
});
</script>
