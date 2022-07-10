<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">VTX</p>
    </header>

    <div class="card-content">
      <div class="content">
        <div class="columns">
          <div class="column is-4 my-2">
            <label for="vtx-protocol">Protocol</label>
          </div>
          <div class="column is-8 my-2">
            <input-select
              id="vtx-protocol"
              v-model.number="settings.protocol"
              :options="vtxProtocolOptions"
            ></input-select>
          </div>
        </div>
      </div>
      <div v-if="settings.detected">
        <div class="columns">
          <div class="column is-4 my-2">
            <label for="vtx-band">Frequency</label>
          </div>
          <div class="column is-8 my-2">
            {{ frequencyTable[settings.band][settings.channel] }}
          </div>
        </div>
        <div class="columns">
          <div class="column is-4 my-2">
            <label for="vtx-band">Band</label>
          </div>
          <div class="column is-8 my-2">
            <input-select
              id="vtx-band"
              v-model.number="settings.band"
              :options="vtxBandOptions"
            ></input-select>
          </div>
        </div>
        <div class="columns">
          <div class="column is-4 my-2">
            <label for="vtx-channel">Channel</label>
          </div>
          <div class="column is-8 my-2">
            <input-select
              id="vtx-channel"
              v-model.number="settings.channel"
              :options="vtxChannelOptions"
            ></input-select>
          </div>
        </div>
        <div class="columns" v-if="settings.pit_mode != 2">
          <div class="column is-4 my-2">
            <label for="vtx-pit-mode">Pit Mode</label>
          </div>
          <div class="column is-8 my-2">
            <input-select
              id="vtx-pit-mode"
              v-model.number="settings.pit_mode"
              :options="vtxPitModeOptions"
            ></input-select>
          </div>
        </div>
        <div class="columns">
          <div class="column is-4 my-2">
            <label for="vtx-power-level">Power Level</label>
          </div>
          <div class="column is-8 my-2">
            <input-select
              id="vtx-power-level"
              v-model.number="settings.power_level"
              :options="vtxPowerLevelOptions"
            ></input-select>
          </div>
        </div>
      </div>
      <div v-else>Not detected</div>
    </div>

    <footer class="card-footer">
      <spinner-btn class="card-footer-item" v-on:click="apply_vtx_settings(settings)">
        Apply
      </spinner-btn>
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapActions } from "vuex";
import { mapFields } from "@/store/helper.js";

export default defineComponent({
  name: "vtx",
  data() {
    return {
      protocolNames: ["INVALID", "TRAMP", "SMARTAUDIO"],
      vtxProtocolOptions: [
        { value: 0, text: "AUTO" },
        { value: 1, text: "TRAMP" },
        { value: 2, text: "SMARTAUDIO" },
      ],
      vtxBandOptions: [
        { value: 0, text: "VTX_BAND_A" },
        { value: 1, text: "VTX_BAND_B" },
        { value: 2, text: "VTX_BAND_E" },
        { value: 3, text: "VTX_BAND_F" },
        { value: 4, text: "VTX_BAND_R" },
      ],
      vtxChannelOptions: [
        { value: 0, text: "VTX_CHANNEL_1" },
        { value: 1, text: "VTX_CHANNEL_2" },
        { value: 2, text: "VTX_CHANNEL_3" },
        { value: 3, text: "VTX_CHANNEL_4" },
        { value: 4, text: "VTX_CHANNEL_5" },
        { value: 5, text: "VTX_CHANNEL_6" },
        { value: 6, text: "VTX_CHANNEL_7" },
        { value: 7, text: "VTX_CHANNEL_8" },
      ],
      vtxPitModeOptions: [
        { value: 0, text: "Off" },
        { value: 1, text: "On" },
        // { value: 2, text: "NO SUPPORT" }
      ],
      vtxPowerLevelOptions: [
        { value: 0, text: "VTX_POWER_LEVEL_1" },
        { value: 1, text: "VTX_POWER_LEVEL_2" },
        { value: 2, text: "VTX_POWER_LEVEL_3" },
        { value: 3, text: "VTX_POWER_LEVEL_4" },
      ],
      frequencyTable: [
        [5865, 5845, 5825, 5805, 5785, 5765, 5745, 5725],
        [5733, 5752, 5771, 5790, 5809, 5828, 5847, 5866],
        [5705, 5685, 5665, 5645, 5885, 5905, 5925, 5945],
        [5740, 5760, 5780, 5800, 5820, 5840, 5860, 5880],
        [5658, 5695, 5732, 5769, 5806, 5843, 5880, 5917],
      ],
    };
  },
  computed: {
    ...mapFields("vtx", ["settings"]),
  },
  methods: {
    ...mapActions(["apply_vtx_settings"]),
  },
});
</script>
