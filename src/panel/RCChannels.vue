<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">RC Channels</p>
    </header>

    <div class="card-content">
      <div class="content">
        <div class="field field-is-2 is-horizontal mb-6">
          <div class="field-label">
            <label class="label">
              Channel Mapping
              <tooltip entry="receiver.channel_mapping" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input-select
                  class="is-fullwidth"
                  v-model.number="receiver_channel_mapping"
                  :options="receiverChannelMappingOptions"
                ></input-select>
              </div>
            </div>
          </div>
        </div>

        <div
          class="field is-horizontal"
          v-for="(style, i) of channelStyle"
          :key="'channel-' + i"
        >
          <div class="field-label" style="align-self: unset">
            <label class="label">
              {{ channelNames[i] }}
            </label>
          </div>
          <div class="field-body">
            <div class="field has-addons">
              <p class="control my-0">
                <input
                  class="input is-small"
                  :id="`limit-${channelNames[i]}-min`"
                  type="number"
                  step="0.1"
                  v-model.number="receiver_stick_calibration_limits[i].min"
                />
              </p>
              <p class="control">
                <a class="button is-small is-static"> min </a>
              </p>
            </div>
            <div class="field has-addons">
              <p class="control my-0">
                <input
                  class="input is-small"
                  :id="`limit-${channelNames[i]}-max`"
                  type="number"
                  step="0.1"
                  v-model.number="receiver_stick_calibration_limits[i].max"
                />
              </p>
              <p class="control">
                <a class="button is-small is-static"> max </a>
              </p>
            </div>
          </div>
          <div class="column is-6 py-0">
            <div class="channel-container">
              <div class="channel-bar" :style="style">
                {{ Math.floor(rx[i] * (i != 3 ? 50 : 100)) }}
              </div>
            </div>
          </div>
        </div>
        <div class="columns mt-5">
          <div class="column is-8 wizard">
            Stick Calibration Wizard <br />
            {{ wizardStates[stick_calibration_wizard] }} <br />
            <span v-if="timerCount">Continuing in {{ timerCount }}s..</span>
          </div>
          <div class="column is-4">
            <spinner-btn class="is-pulled-right is-primary" @click="cal_sticks()">
              Calibrate
            </spinner-btn>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { StickWizardState } from "@/store/constants";
import { defineComponent } from "vue";
import { mapState, mapActions } from "vuex";
import { mapFields } from "@/store/helper.js";

export default defineComponent({
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
      rx: (state) => state.state.rx_filtered,
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
});
</script>

<style lang="scss" scoped>
.channel-container {
  background-color: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.125);
  border-radius: 8px;

  width: 100%;

  .channel-bar {
    color: #fff;
    background-color: hsl(96deg 56% 43%);
    border-radius: 8px;
    text-align: center;

    margin-left: 50%;
  }
}
.wizard {
  font-size: 1.25rem;
}
</style>
