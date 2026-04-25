<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Aux Channels</p>
    </header>

    <div class="card-content">
      <div class="content">
        <div class="aux-list">
          <section v-for="f in auxFunctions" :key="f.key" class="box py-3 mb-3">
            <div
              v-if="default_profile.has_legacy_aux"
              class="field is-horizontal mb-0"
            >
              <div class="field-label">
                <label
                  class="label"
                  :for="f.key"
                  :class="classForIndex(f.index)"
                >
                  {{ functionLabel(f.key) }}
                  <tooltip :entry="'channel.' + f.key.toLowerCase()" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      :id="f.key"
                      :model-value="channelForIndex(f.index)"
                      class="is-fullwidth"
                      :options="auxChannels"
                      @update:modelValue="setChannel(f.index, $event)"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="columns is-vcentered is-variable is-4 mb-0">
              <div class="column is-3">
                <label
                  class="label mb-1"
                  :for="f.key"
                  :class="classForIndex(f.index)"
                >
                  {{ functionLabel(f.key) }}
                  <tooltip :entry="'channel.' + f.key.toLowerCase()" />
                </label>
                <div class="field aux-channel-field mb-0">
                  <input-select
                    :id="f.key"
                    :model-value="channelForIndex(f.index)"
                    class="aux-channel-select"
                    :options="auxChannels"
                    @update:modelValue="setChannel(f.index, $event)"
                  ></input-select>
                </div>
              </div>

              <div class="column">
                <aux-range-control
                  v-if="hasRanges && channelForIndex(f.index) < 12"
                  :min="rangePercent(f.index, 'min')"
                  :max="rangePercent(f.index, 'max')"
                  :current="currentAuxPercent(channelForIndex(f.index))"
                  @update:min="setRangeMin(f.index, $event)"
                  @update:max="setRangeMax(f.index, $event)"
                />
                <div v-else class="help aux-range-help">
                  Range is not used for OFF / ON channels.
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { $enum } from "ts-enum-util";
import AuxRangeControl from "@/components/AuxRangeControl.vue";
import { useConstantStore } from "@/store/constants";
import { useDefaultProfileStore } from "@/store/default_profile";
import { useProfileStore } from "@/store/profile";
import { useStateStore } from "@/store/state";
import { mapState } from "pinia";
import type { aux_function_map_t } from "@/store/types";

export default defineComponent({
  name: "AuxChannels",
  components: { AuxRangeControl },
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
            text: key,
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
      return this.profile.profileVersionGt("0.2.4") && this.isMapFormat();
    },
  },
  methods: {
    isMapFormat(): boolean {
      const aux = this.profile.receiver.aux;
      if (!aux || aux.length === 0) return false;
      return (
        typeof aux[0] === "object" && aux[0] !== null && "channel" in aux[0]
      );
    },
    getAuxEntry(index: number): aux_function_map_t | null {
      const aux = this.profile.receiver.aux;
      if (!aux || !aux[index]) return null;
      if (
        typeof aux[index] === "object" &&
        aux[index] !== null &&
        "channel" in aux[index]
      ) {
        return aux[index] as aux_function_map_t;
      }
      return null;
    },
    channelForIndex(index: number): number {
      const entry = this.getAuxEntry(index);
      if (entry) return entry.channel;
      const aux = this.profile.receiver.aux;
      if (aux && typeof aux[index] === "number") return aux[index];
      return 12;
    },
    functionLabel(key: string): string {
      return key.replace(/^AUX_/, "").replaceAll("_", " ");
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
      if (channel < 0 || channel >= 12) return null;
      const value = this.state.aux[channel];
      if (value === undefined || value === null) return null;
      if (value <= 1) return value ? 100 : 0;
      return Math.round((value / 65535) * 100);
    },
    setChannel(index: number, value: number) {
      const aux = [...this.profile.receiver.aux];
      if (!this.default_profile.has_legacy_aux && this.isMapFormat()) {
        const entry = (aux[index] as aux_function_map_t) || {
          channel: 0,
          range_min: 0,
          range_max: 65535,
        };
        aux[index] = { ...entry, channel: value };
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
      if (channel === 12) return "aux-function-off";
      if (channel === 13) return "aux-function-on";
      const current = this.currentAuxPercent(channel);
      if (current === null) return "";
      if (this.default_profile.has_legacy_aux) {
        return current > 0 ? "aux-function-on" : "aux-function-off";
      }
      return current >= this.rangePercent(index, "min") &&
        current <= this.rangePercent(index, "max")
        ? "aux-function-on"
        : "aux-function-off";
    },
  },
});
</script>

<style scoped>
.aux-list .box {
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

.aux-range-help {
  color: var(--bulma-text, currentColor);
}

.aux-function-off {
  color: var(--bulma-danger, #ff3860);
}

.aux-function-on {
  color: var(--bulma-primary, #00d1b2);
}
</style>
