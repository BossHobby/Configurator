<template>
  <b-card>
    <h5 slot="header" class="mb-0">RC Channels</h5>
    <b-row class="mb-4">
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
      <b-col sm="2">{{ channelNames[i] }}</b-col>
      <b-col sm="2">
        <b-input-group size="sm" prepend="min">
          <b-form-input
            :id="`limit-${channelNames[i]}-min`"
            type="number"
            step="0.1"
            size="sm"
            v-model.number="receiver_stick_calibration_limits[i].min"
          ></b-form-input>
        </b-input-group>
      </b-col>
      <b-col sm="2">
        <b-input-group size="sm" prepend="max">
          <b-form-input
            :id="`limit-${channelNames[i]}-max`"
            type="number"
            step="0.1"
            size="sm"
            v-model.number="receiver_stick_calibration_limits[i].max"
          ></b-form-input>
        </b-input-group>
      </b-col>
      <b-col sm="6">
        <div class="channel-container">
          <div class="channel-bar" :style="style">
            {{ Math.floor(rx[i] * (i != 3 ? 50 : 100)) }}
          </div>
        </div>
      </b-col>
    </b-row>
    <b-row>
      <b-col class="mt-4 wizard" sm="8">
        Stick Calibration Wizard <br />
        {{ wizardStates[stick_calibration_wizard] }} <br />
        <span v-if="timerCount">Continuing in {{ timerCount }}s..</span>
      </b-col>
      <b-col class="mt-4" sm="4">
        <b-button class="float-right" v-on:click="cal_sticks()">
          Calibrate
        </b-button>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import { mapState, mapActions } from "vuex";
import { mapFields } from "@/store/helper.js";
import { StickWizardState } from "@/store/modules/constants";

export default {
  name: "RCChannels",
  data() {
    return {
      timerCount: 0,
      timerTimeout: null,
      receiverChannelMappingOptions: [
        { value: 0, text: "AETR" },
        { value: 1, text: "TAER" },
      ],
      channelNames: ["Roll", "Pitch", "Yaw", "Throttle"],
      wizardStates: [
        "", //STICK_WIZARD_INACTIVE
        "Succeeded", //STICK_WIZARD_SUCCESS
        "Failed", //STICK_WIZARD_FAILED
        "", //STICK_WIZARD_START
        "Recording, move sticks to extents", //STICK_WIZARD_CAPTURE_STICKS
        "Testing calibration, move sticks again to extents", //STICK_WIZARD_WAIT_FOR_CONFIRM
        "", //STICK_WIZARD_CONFIRMED
        "", //STICK_WIZARD_TIMEOUT
      ],
    };
  },
  computed: {
    ...mapFields("profile", [
      "receiver.channel_mapping",
      "receiver.stick_calibration_limits",
    ]),
    ...mapState({
      rx: (state) => state.state.rx,
      stick_calibration_wizard: (state) => state.state.stick_calibration_wizard,
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
  watch: {
    timerCount: {
      handler(value) {
        clearTimeout(this.timerTimeout);

        if (value > 0) {
          this.timerTimeout = setTimeout(() => {
            this.timerCount--;
          }, 1000);
        }
      },
      immediate: true, // This ensures the watcher is triggered upon creation
    },
    stick_calibration_wizard: {
      handler(val) {
        switch (val) {
          case StickWizardState.STICK_WIZARD_SUCCESS:
          case StickWizardState.STICK_WIZARD_FAILED:
            this.timerCount = 0;
            setTimeout(() => this.fetch_profile(), 500);
            break;

          case StickWizardState.STICK_WIZARD_CAPTURE_STICKS:
          case StickWizardState.STICK_WIZARD_WAIT_FOR_CONFIRM:
            this.timerCount = 19;
            break;

          default:
            break;
        }
      },
      immediate: true,
    },
  },
  methods: {
    ...mapActions(["cal_sticks", "fetch_profile"]),
  },
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
.wizard {
  font-size: 1.25rem;
}
</style>
