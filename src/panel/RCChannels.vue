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
              <tooltip entry="receiver.role_map" />
            </label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control is-expanded">
                <input-select
                  v-model.number="selectedPreset"
                  class="is-fullwidth"
                  :options="receiverChannelMappingOptions"
                ></input-select>
              </div>
            </div>
          </div>
        </div>

        <div class="rx-role-list">
          <section
            v-for="(_, i) in channelNames"
            :key="'role-' + i"
            class="box py-3 mb-3"
          >
            <div class="columns is-vcentered is-variable is-4 mb-0">
              <div class="column is-3">
                <label class="label mb-1" :for="`role-channel-${i}`">
                  {{ channelNames[i] }}
                  <tooltip entry="receiver.role_map" />
                </label>
                <div class="field aux-channel-field mb-2">
                  <input-select
                    :id="`role-channel-${i}`"
                    :model-value="roleMap(i).channel"
                    class="aux-channel-select"
                    :options="rxChannelOptions"
                    @update:modelValue="setRoleField(i, 'channel', $event)"
                  ></input-select>
                </div>
              </div>

              <div class="column">
                <rc-calibration-control
                  :min="roleMap(i).min"
                  :center="roleMap(i).center"
                  :max="roleMap(i).max"
                  :current="sourceChannelValue(i)"
                  @update:min="setRoleField(i, 'min', $event)"
                  @update:center="setRoleField(i, 'center', $event)"
                  @update:max="setRoleField(i, 'max', $event)"
                />
              </div>
            </div>
          </section>
        </div>
        <div class="columns is-mobile mt-5">
          <div class="column is-8 wizard">
            Stick Calibration Wizard <br />
            {{ wizardStates[state.stick_calibration_wizard] }} <br />
            <span v-if="timerCount">Continuing in {{ timerCount }}s..</span>
          </div>
          <div class="column is-4">
            <spinner-btn
              class="is-pulled-right is-primary"
              @click="root.cal_sticks()"
            >
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
import { useStateStore } from "@/store/state";
import { useProfileStore } from "@/store/profile";
import { useRootStore } from "@/store/root";
import { useInfoStore } from "@/store/info";
import type { rx_role_map_t } from "@/store/types";
import RcCalibrationControl from "@/components/RcCalibrationControl.vue";

export default defineComponent({
  name: "RCChannels",
  components: { RcCalibrationControl },
  setup() {
    return {
      root: useRootStore(),
      state: useStateStore(),
      profile: useProfileStore(),
      info: useInfoStore(),
    };
  },
  data() {
    return {
      timerCount: 0,
      timerTimeout: 0,
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
    receiverChannelMappingOptions() {
      if (this.info.is_rover) {
        return [
          { value: 0, text: "Aircraft Radio" },
          { value: 2, text: "Pistol Radio" },
        ];
      }
      return [
        { value: 0, text: "AETR" },
        { value: 1, text: "TAER" },
      ];
    },
    channelNames() {
      return this.info.is_rover
        ? ["Throttle", "Steering"]
        : ["Roll", "Pitch", "Yaw", "Throttle"];
    },
    channelValues() {
      return this.info.is_rover
        ? [this.state.rx_filtered?.[3] || 0, this.state.rx_filtered?.[2] || 0]
        : this.state.rx_filtered;
    },
    rxChannelOptions() {
      return Array.from({ length: 16 }, (_, i) => ({
        value: i,
        text: `CHANNEL_${i + 1}`,
      }));
    },
    selectedPreset: {
      get(): number {
        const channels = this.profile.receiver.role_map
          .map((role) => role.channel)
          .join(",");
        if (this.info?.is_rover) {
          return channels === "1,0" ? 2 : 0;
        }
        return channels === "1,2,3,0" ? 1 : 0;
      },
      set(value: number) {
        if (this.info?.is_rover) {
          const channels = value === 2 ? [1, 0] : [2, 3];
          this.profile.receiver.role_map = channels.map((channel) => ({
            channel,
            min: -1,
            center: 0,
            max: 1,
          }));
          return;
        }
        const channels = value === 1 ? [1, 2, 3, 0] : [0, 1, 3, 2];
        this.profile.receiver.role_map = channels.map((channel) => ({
          channel,
          min: -1,
          center: 0,
          max: 1,
        }));
      },
    },
  },
  methods: {
    defaultRoleMap(index: number): rx_role_map_t {
      return {
        channel: index,
        min: -1,
        center: 0,
        max: 1,
      };
    },
    roleMap(index: number): rx_role_map_t {
      return (
        this.profile.receiver.role_map?.[index] || this.defaultRoleMap(index)
      );
    },
    setRoleField(index: number, field: keyof rx_role_map_t, value: number) {
      const roleMap = [...(this.profile.receiver.role_map || [])];
      const numericValue = Number(value);
      roleMap[index] = {
        ...this.defaultRoleMap(index),
        ...roleMap[index],
        [field]: field === "channel" ? Math.trunc(numericValue) : numericValue,
      };
      this.profile.receiver = { ...this.profile.receiver, role_map: roleMap };
    },
    sourceChannelValue(index: number): number {
      const channel = this.roleMap(index).channel;
      const raw = this.state.rx_channels?.[channel];
      if (raw === undefined || raw === null) return 0;
      return Math.max(-1, Math.min(1, (Number(raw) / 65535) * 2 - 1));
    },
  },
  watch: {
    timerCount: {
      handler(value) {
        clearTimeout(this.timerTimeout);

        if (value > 0) {
          this.timerTimeout = window.setTimeout(() => {
            this.timerCount--;
          }, 1000);
        }
      },
      immediate: true, // This ensures the watcher is triggered upon creation
    },
    "state.stick_calibration_wizard": {
      handler(val) {
        switch (val) {
          case StickWizardState.STICK_WIZARD_SUCCESS:
          case StickWizardState.STICK_WIZARD_FAILED:
            this.timerCount = 0;
            setTimeout(() => this.profile.fetch_profile(), 500);
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
});
</script>

<style lang="scss" scoped>
.rx-role-list .box {
  box-shadow: none;
  border: 1px solid var(--bulma-border, #dbdbdb);
}

.aux-channel-field :deep(.select),
.aux-channel-field :deep(select) {
  max-width: 100%;
}

.aux-channel-select {
  display: inline-block;
}

.wizard {
  font-size: 1.25rem;
}
</style>
