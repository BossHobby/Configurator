<template>
  <div class="min-w-0 rounded-lg border border-line bg-panel text-ink">
    <header
      class="flex items-center justify-between gap-3 px-4 py-3 border-b border-line"
    >
      <p class="text-sm font-semibold">Navigation</p>
      <small class="shrink-0 text-muted" v-if="state.gps_lock">
        {{ state.home_distance.toFixed(0) }}m home
      </small>
    </header>

    <div class="p-4">
      <div class="space-y-4">
        <div class="form-row">
          <div class="form-label">
            <label class="text-sm font-medium text-ink">Failsafe RTH</label>
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <div class="min-w-0">
                <input
                  id="rth_on_failsafe"
                  type="checkbox"
                  class="form-switch"
                  v-model="profile.navigation.rth_on_failsafe"
                />
                <label for="rth_on_failsafe"></label>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <div class="min-w-0 col-span-12 md:col-span-6">
            <number-field
              label="RTH Climb Height"
              unit="m"
              step="0.5"
              min="0"
              v-model="profile.navigation.rth_altitude"
            />
            <number-field
              label="Return Speed"
              unit="km/h"
              step="0.1"
              min="0.36"
              v-model="cruiseSpeedKph"
            />
          </div>
          <div class="min-w-0 col-span-12 md:col-span-6">
            <number-field
              label="Min Throttle"
              unit="%"
              step="1"
              min="0"
              max="100"
              v-model="throttleMinPercent"
            />
            <number-field
              label="Hover Throttle"
              unit="%"
              step="1"
              min="0"
              max="100"
              v-model="throttleHoverPercent"
            />
            <number-field
              label="Max Throttle"
              unit="%"
              step="1"
              min="0"
              max="100"
              v-model="throttleMaxPercent"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, h } from "vue";
import { useProfileStore } from "@/store/profile";
import { useStateStore } from "@/store/state";

const NumberField = defineComponent({
  name: "NumberField",
  props: {
    label: { type: String, required: true },
    unit: { type: String, default: "" },
    modelValue: { type: Number, required: true },
    step: { type: String, default: "1" },
    min: { type: String, default: undefined },
    max: { type: String, default: undefined },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h("div", { class: "form-row" }, [
        h("div", { class: "form-label" }, [
          h("label", { class: "text-sm font-medium text-ink" }, props.label),
        ]),
        h("div", { class: "flex min-w-0 items-center gap-3" }, [
          h("div", { class: "flex min-w-0 flex-1 items-center gap-2" }, [
            h("div", { class: "min-w-0 flex-1" }, [
              h("input", {
                class: "form-input",
                type: "number",
                step: props.step,
                min: props.min,
                max: props.max,
                value: props.modelValue,
                onInput: (event: Event) => {
                  emit(
                    "update:modelValue",
                    Number((event.target as HTMLInputElement).value),
                  );
                },
              }),
            ]),
            props.unit
              ? h("p", { class: "shrink-0" }, [
                  h(
                    "span",
                    {
                      class:
                        "rounded-md border border-line bg-subtle px-3 py-2 text-sm text-muted",
                    },
                    props.unit,
                  ),
                ])
              : null,
          ]),
        ]),
      ]);
  },
});

export default defineComponent({
  name: "Navigation",
  components: { NumberField },
  setup() {
    const profile = useProfileStore();
    const state = useStateStore();

    return { profile, state };
  },
  computed: {
    throttleMinPercent: {
      get(): number {
        return Number(
          (this.profile.navigation.rth_throttle_min * 100).toFixed(2),
        );
      },
      set(value: number) {
        this.profile.navigation.rth_throttle_min = value / 100;
      },
    },
    throttleHoverPercent: {
      get(): number {
        return Number(
          (this.profile.navigation.rth_throttle_hover * 100).toFixed(2),
        );
      },
      set(value: number) {
        this.profile.navigation.rth_throttle_hover = value / 100;
      },
    },
    throttleMaxPercent: {
      get(): number {
        return Number(
          (this.profile.navigation.rth_throttle_max * 100).toFixed(2),
        );
      },
      set(value: number) {
        this.profile.navigation.rth_throttle_max = value / 100;
      },
    },
    cruiseSpeedKph: {
      get(): number {
        return Number(
          (this.profile.navigation.rth_cruise_speed * 3.6).toFixed(2),
        );
      },
      set(value: number) {
        this.profile.navigation.rth_cruise_speed = value / 3.6;
      },
    },
  },
});
</script>
