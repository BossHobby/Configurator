<template>
  <div
    class="grid items-stretch gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
  >
    <Panel title="Live Channels" description="Live receiver input">
      <div class="space-y-4">
        <ChannelMeter
          v-for="(name, i) in channelNames"
          :key="name"
          :label="name"
          :value="channelValues[i] ?? 0"
          :min="name === 'Throttle' && !info.is_rover ? 0 : -1"
          :max="1"
        />
      </div>
    </Panel>
    <Panel title="Channel Mapping">
      <template #actions
        ><input-select
          v-model.number="selectedPreset"
          aria-label="Channel order preset"
          :options="receiverChannelMappingOptions"
          class="w-28"
      /></template>
      <div class="overflow-x-auto">
        <table class="w-full text-xs tabular-nums">
          <thead>
            <tr class="border-b border-line text-muted">
              <th class="pb-2 text-left font-normal">Axis</th>
              <th class="pb-2 text-left font-normal">Channel</th>
              <th class="pb-2 text-right font-normal">Min</th>
              <th class="pb-2 text-right font-normal">Center</th>
              <th class="pb-2 text-right font-normal">Max</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(name, i) in channelNames"
              :key="name"
              class="border-b border-line"
            >
              <th class="py-1.5 pr-3 text-left font-medium">{{ name }}</th>
              <td class="py-1.5 pr-3">
                <input-select
                  :model-value="roleMap(i).channel"
                  :aria-label="name + ' channel'"
                  :options="rxChannelOptions"
                  class="w-24"
                  @update:model-value="setRoleField(i, 'channel', $event)"
                />
              </td>
              <td class="px-2 text-right">{{ roleMap(i).min.toFixed(2) }}</td>
              <td class="px-2 text-right">
                {{ roleMap(i).center.toFixed(2) }}
              </td>
              <td class="pl-2 text-right">{{ roleMap(i).max.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <details class="mt-3">
        <summary class="cursor-pointer text-xs text-muted">
          Channel calibration
        </summary>
        <div class="mt-4 space-y-5">
          <div v-for="(name, i) in channelNames" :key="name">
            <p class="mb-2 text-xs font-medium">{{ name }}</p>
            <rc-calibration-control
              :label="name"
              :min="roleMap(i).min"
              :center="roleMap(i).center"
              :max="roleMap(i).max"
              :current="sourceChannelValue(i)"
              @update:min="setRoleField(i, 'min', $event)"
              @update:center="setRoleField(i, 'center', $event)"
              @update:max="setRoleField(i, 'max', $event)"
            />
          </div>
          <div
            class="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 text-xs text-muted"
          >
            <p>
              Stick calibration ·
              {{ wizardStates[state.stick_calibration_wizard] || "Ready"
              }}<span v-if="timerCount">
                · Continuing in {{ timerCount }}s</span
              >
            </p>
            <spinner-btn @click="root.cal_sticks()">Calibrate</spinner-btn>
          </div>
        </div>
      </details>
    </Panel>
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
import Panel from "@/components/ui/Panel.vue";
import ChannelMeter from "@/components/ui/ChannelMeter.vue";
import RcCalibrationControl from "@/components/RcCalibrationControl.vue";

export default defineComponent({
  name: "RCChannels",
  components: { RcCalibrationControl, Panel, ChannelMeter },
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
        text: `CH${i + 1}`,
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
});
</script>
