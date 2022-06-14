<template>
  <b-card>
    <h5 slot="header" class="mb-0">RC Channels</h5>
    <b-row>
      <b-col sm="4" class="my-2">
        <label>
          Channel Mapping
          <tooltip entry="receiver.channel_mapping" />
        </label>
      </b-col>
      <b-col sm="4" class="my-2">
        <b-form-select
          v-model.number="receiver_channel_mapping"
          :options="receiverChannelMappingOptions"
        ></b-form-select>
      </b-col>
    </b-row>
    <b-row
      class="my-2"
      v-for="(style, i) of channelStyle"
      :key="'channel-' + i"
    >
      <b-col sm="4">{{ channelLabels[i] }}</b-col>
      <b-col sm="8">
        <div class="channel-container">
          <div class="channel-bar" :style="style">
            {{ Math.floor(rx[i] * (i != 3 ? 50 : 100)) }}
          </div>
        </div>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import { mapState } from "vuex";
import { mapFields } from "@/store/helper.js";

export default {
  name: "RCChannels",
  data() {
    return {
      receiverChannelMappingOptions: [
        { value: 0, text: "AETR" },
        { value: 1, text: "TAER" },
      ],
      channelLabels: ["Roll", "Pitch", "Yaw", "Throttle"],
    };
  },
  computed: {
    ...mapFields("profile", ["receiver.channel_mapping"]),
    ...mapState({
      rx: (state) => state.state.rx,
    }),
    channelStyle() {
      return this.rx.map((r, i) => {
        if (i == 3) {
          // throttle
          let value = 2 + Math.abs(r) * 98;
          return {
            "margin-left": "0%",
            width: value + "%",
          };
        }

        let value = 2 + Math.abs(r) * 49;
        return {
          "margin-left": r < 0 ? 51 - value + "%" : "49%",
          width: value + "%",
        };
      });
    },
  },
  methods: {},
};
</script>

<style lang="scss" scoped>
.channel-container {
  background-color: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.125);
  border-radius: 8px;

  width: 100%;

  .channel-bar {
    color: #fff;
    background-color: #2196f3;
    border-radius: 8px;
    text-align: center;

    margin-left: 50%;
  }
}
</style>
