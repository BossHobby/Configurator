<template>
  <Panel title="Navigation" description="Return-to-home behaviour.">
    <template v-if="state.gps_lock" #actions>
      <span class="text-xs text-muted tabular-nums"
        >{{ state.home_distance.toFixed(0) }} m from home</span
      >
    </template>
    <label class="mb-5 inline-flex items-center gap-3 text-sm">
      <input
        v-model="profile.navigation.rth_on_failsafe"
        type="checkbox"
        class="form-switch"
      />
      Return to home on failsafe
    </label>
    <div class="form-grid">
      <div v-for="field in fields" :key="field.id" class="form-row">
        <label class="form-label" :for="field.id">{{ field.label }}</label>
        <div class="relative">
          <input
            :id="field.id"
            :value="read(field.key)"
            class="form-input pr-14"
            type="number"
            :step="field.step"
            :min="field.min"
            :max="field.max"
            @input="write(field.key, $event)"
          />
          <span
            class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted"
            >{{ field.unit }}</span
          >
        </div>
      </div>
    </div>
  </Panel>
</template>

<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
import { defineComponent } from "vue";
import { useProfileStore } from "@/store/profile";
import { useStateStore } from "@/store/state";

export default defineComponent({
  name: "Navigation",
  components: { Panel },
  setup() {
    const profile = useProfileStore();
    const state = useStateStore();

    return { profile, state };
  },
  data() {
    return {
      fields: [
        {
          id: "nav-rth-altitude",
          key: "rthAltitude",
          label: "RTH climb height",
          unit: "m",
          step: 0.5,
          min: 0,
        },
        {
          id: "nav-cruise-speed",
          key: "cruiseSpeedKph",
          label: "Return speed",
          unit: "km/h",
          step: 0.1,
          min: 0.36,
        },
        {
          id: "nav-throttle-min",
          key: "throttleMinPercent",
          label: "Min throttle",
          unit: "%",
          step: 1,
          min: 0,
          max: 100,
        },
        {
          id: "nav-throttle-hover",
          key: "throttleHoverPercent",
          label: "Hover throttle",
          unit: "%",
          step: 1,
          min: 0,
          max: 100,
        },
        {
          id: "nav-throttle-max",
          key: "throttleMaxPercent",
          label: "Max throttle",
          unit: "%",
          step: 1,
          min: 0,
          max: 100,
        },
      ] as const,
    };
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
    rthAltitude: {
      get(): number {
        return this.profile.navigation.rth_altitude;
      },
      set(value: number) {
        this.profile.navigation.rth_altitude = value;
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
  methods: {
    read(key: string): number {
      return this[key];
    },
    write(key: string, event: Event) {
      const value = (event.target as HTMLInputElement).valueAsNumber;
      if (Number.isFinite(value)) this[key] = value;
    },
  },
});
</script>
