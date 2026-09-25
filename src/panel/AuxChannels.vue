<template>
  <Panel title="AUX Functions">
    <div class="divide-y divide-line">
      <section
        v-for="f in auxFunctions"
        :key="f.key"
        class="grid grid-cols-1 items-center gap-4 py-3 lg:grid-cols-[12rem_12rem_minmax(0,1fr)]"
      >
        <label :for="f.key" class="text-sm font-medium text-ink">
          <span
            class="mr-1 inline-block size-2 rounded-full"
            :class="classForIndex(f.index)"
            aria-hidden="true" />
          {{ functionLabel(f.key) }}
          <tooltip :entry="'channel.' + f.key.toLowerCase()"
        /></label>
        <input-select
          :id="f.key"
          :model-value="channelForIndex(f.index)"
          :options="auxChannels"
          @update:model-value="setChannel(f.index, $event)"
        />
        <aux-range-control
          v-if="
            hasRanges && channelForIndex(f.index) < maxSelectableRxChannel()
          "
          :label="functionLabel(f.key)"
          :min="rangePercent(f.index, 'min')"
          :max="rangePercent(f.index, 'max')"
          :current="currentAuxPercent(channelForIndex(f.index))"
          @update:min="setRangeMin(f.index, $event)"
          @update:max="setRangeMax(f.index, $event)"
        />
        <p v-else-if="hasRanges" class="text-xs text-muted">
          Activation range does not apply to Always off / Always on.
        </p>
      </section>
    </div>
  </Panel>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { receiverChannelPercent, auxRangeActive } from "@/ui/receiver";
import { $enum } from "ts-enum-util";
import Panel from "@/components/ui/Panel.vue";
import AuxRangeControl from "@/components/AuxRangeControl.vue";
import { useConstantStore } from "@/store/constants";
import { useDefaultProfileStore } from "@/store/default_profile";
import { useProfileStore } from "@/store/profile";
import { useStateStore } from "@/store/state";
import { mapState } from "pinia";
import type { aux_function_map_t } from "@/store/types";

export default defineComponent({
  name: "AuxChannels",
  components: { AuxRangeControl, Panel },
  setup() {
    return {
      default_profile: useDefaultProfileStore(),
      profile: useProfileStore(),
      state: useStateStore(),
    };
  },
  computed: {
    ...mapState(useConstantStore, {
      auxChannels: (state) => {
        return $enum(state.AuxChannels).map((value, key) => {
          return {
            text: key.startsWith("CHANNEL_")
              ? key.replace("CHANNEL_", "Channel ")
              : key === "OFF"
                ? "Always off"
                : key === "ON"
                  ? "Always on"
                  : key,
            value,
          };
        });
      },
      auxFunctions: (state) => {
        return $enum(state.AuxFunctions)
          .getKeys()
          .map((f, index) => {
            return {
              index,
              key: f,
            };
          })
          .filter((f) => !f.key.startsWith("_"));
      },
    }),
    hasRanges(): boolean {
      return !this.default_profile.has_legacy_aux;
    },
  },
  methods: {
    getAuxEntry(index: number): aux_function_map_t | null {
      if (this.default_profile.has_legacy_aux) return null;
      return (this.profile.receiver.aux[index] as aux_function_map_t) || null;
    },
    channelForIndex(index: number): number {
      const entry = this.getAuxEntry(index);
      if (entry) return entry.channel;
      const aux = this.profile.receiver.aux;
      if (this.default_profile.has_legacy_aux && aux[index] !== undefined) {
        return aux[index] as number;
      }
      return this.profile.profileVersionGt("0.2.5") ? 16 : 12;
    },
    maxSelectableRxChannel(): number {
      return this.profile.profileVersionGt("0.2.5") ? 16 : 12;
    },
    functionLabel(key: string): string {
      const labels: Record<string, string> = {
        AUX_LEVELMODE: "Level mode",
        AUX_RACEMODE: "Race mode",
        AUX_ACROMODE: "Acro mode",
        AUX_BUZZER_ENABLE: "Buzzer",
        AUX_RSSI: "RSSI",
        AUX_FPV_SWITCH: "FPV switch",
        AUX_OSD_PROFILE: "OSD profile",
      };
      const label = key.replace(/^AUX_/, "").replaceAll("_", " ").toLowerCase();
      return labels[key] || label.charAt(0).toUpperCase() + label.slice(1);
    },
    rangePercent(index: number, field: "min" | "max"): number {
      const entry = this.getAuxEntry(index);
      if (!entry) return field === "min" ? 0 : 100;
      return Math.round(
        (entry[field === "min" ? "range_min" : "range_max"] / 65535) * 100,
      );
    },
    rangeSummary(index: number): string {
      return `${this.rangePercent(index, "min")}% to ${this.rangePercent(index, "max")}%`;
    },
    currentAuxPercent(channel: number): number | null {
      const directChannels = this.profile.profileVersionGt("0.2.5");
      const maxChannel = directChannels ? 16 : 12;
      if (channel < 0 || channel >= maxChannel) return null;
      const value = directChannels
        ? (this.state.rx_channels?.[channel] ?? this.state.aux[channel])
        : this.state.aux[channel];
      if (value === undefined || value === null) return null;
      if (!directChannels && value <= 1) return value ? 100 : 0;
      return receiverChannelPercent(value);
    },
    setChannel(index: number, value: number) {
      const aux = [...this.profile.receiver.aux];
      if (!this.default_profile.has_legacy_aux) {
        const entry = (aux[index] as aux_function_map_t) || {
          channel: 0,
          range_min: 0,
          range_max: 0,
        };
        const nextEntry = { ...entry, channel: value };
        if (
          value >= 0 &&
          value < this.maxSelectableRxChannel() &&
          entry.range_min === entry.range_max
        ) {
          nextEntry.range_min = Math.round(0.7 * 65535);
          nextEntry.range_max = 65535;
        }
        aux[index] = nextEntry;
      } else {
        aux[index] = value as any;
      }
      this.profile.receiver = { ...this.profile.receiver, aux };
    },
    setRangeMin(index: number, value: number) {
      this.setRangeField(index, "range_min", value);
    },
    setRangeMax(index: number, value: number) {
      this.setRangeField(index, "range_max", value);
    },
    setRangeField(
      index: number,
      field: "range_min" | "range_max",
      percent: number,
    ) {
      const aux = [...this.profile.receiver.aux];
      const entry = (aux[index] as aux_function_map_t) || {
        channel: 0,
        range_min: 0,
        range_max: 65535,
      };
      const raw = Math.round((percent / 100) * 65535);
      aux[index] = { ...entry, [field]: raw };
      this.profile.receiver = { ...this.profile.receiver, aux };
    },
    classForIndex(index: number) {
      if (!this.profile.receiver.aux) {
        return "";
      }

      const channel = this.channelForIndex(index);
      const offChannel = this.profile.profileVersionGt("0.2.5") ? 16 : 12;
      const onChannel = offChannel + 1;
      if (channel === offChannel) return "aux-function-off";
      if (channel === onChannel) return "aux-function-on";
      const current = this.currentAuxPercent(channel);
      if (current === null) return "";
      if (this.default_profile.has_legacy_aux) {
        return current > 0 ? "aux-function-on" : "aux-function-off";
      }
      const entry = this.getAuxEntry(index);
      const raw = this.profile.profileVersionGt("0.2.5")
        ? this.state.rx_channels?.[channel]
        : this.state.aux[channel];
      return entry && auxRangeActive(raw, entry.range_min, entry.range_max)
        ? "aux-function-on"
        : "aux-function-off";
    },
  },
});
</script>

<style scoped>
.aux-function-off {
  background: var(--ui-muted);
}
.aux-function-on {
  background: var(--ui-accent);
}
</style>
