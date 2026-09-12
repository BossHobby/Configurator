<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Navigation</p>
      <small class="card-header-icon" v-if="state.gps_lock">
        {{ state.home_distance.toFixed(0) }}m home
      </small>
    </header>

    <div class="card-content">
      <div class="content column-narrow field-is-5">
        <div class="field is-horizontal">
          <div class="field-label">
            <label class="label">Failsafe RTH</label>
          </div>
          <div class="field-body">
            <div class="field">
              <div class="control">
                <input
                  id="rth_on_failsafe"
                  type="checkbox"
                  class="switch"
                  v-model="profile.navigation.rth_on_failsafe"
                />
                <label for="rth_on_failsafe"></label>
              </div>
            </div>
          </div>
        </div>

        <div class="columns">
          <div class="column">
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
          <div class="column">
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
      h("div", { class: "field is-horizontal" }, [
        h("div", { class: "field-label" }, [
          h("label", { class: "label" }, props.label),
        ]),
        h("div", { class: "field-body" }, [
          h("div", { class: "field has-addons" }, [
            h("div", { class: "control is-expanded" }, [
              h("input", {
                class: "input",
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
              ? h("p", { class: "control" }, [
                  h("span", { class: "button is-static" }, props.unit),
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
