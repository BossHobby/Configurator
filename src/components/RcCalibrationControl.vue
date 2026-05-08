<template>
  <div class="rc-calibration-control">
    <div class="rc-calibration-values is-size-7">
      <span class="rc-calibration-value">Min {{ displayValue(minValue) }}</span>
      <span class="rc-calibration-value"
        >Center {{ displayValue(centerValue) }}</span
      >
      <span
        v-if="currentValue !== null"
        class="rc-calibration-value is-current"
      >
        Current {{ displayValue(currentValue) }}
      </span>
      <span class="rc-calibration-value">Max {{ displayValue(maxValue) }}</span>
    </div>

    <div class="rc-calibration-track">
      <div class="rc-calibration-center-line"></div>
      <div
        class="rc-calibration-fill"
        :style="{
          left: `${percentForValue(minValue)}%`,
          width: `${percentForValue(maxValue) - percentForValue(minValue)}%`,
        }"
      ></div>
      <div
        class="rc-calibration-center"
        :style="{ left: `${percentForValue(centerValue)}%` }"
      ></div>
      <div
        v-if="currentValue !== null"
        class="rc-calibration-current"
        :style="{ left: `${percentForValue(currentValue)}%` }"
      ></div>

      <input
        class="rc-calibration-input"
        type="range"
        min="-100"
        max="100"
        :value="percentInputValue(minValue)"
        @input="setMin($event)"
      />
      <input
        class="rc-calibration-input"
        type="range"
        min="-100"
        max="100"
        :value="percentInputValue(centerValue)"
        @input="setCenter($event)"
      />
      <input
        class="rc-calibration-input"
        type="range"
        min="-100"
        max="100"
        :value="percentInputValue(maxValue)"
        @input="setMax($event)"
      />
    </div>

    <div class="rc-calibration-ticks is-size-7">
      <span
        v-for="tick in ticks"
        :key="tick.value"
        class="rc-calibration-tick"
        :style="{ left: `${percentForValue(tick.value)}%` }"
      >
        {{ tick.label }}
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "RcCalibrationControl",
  props: {
    min: { type: Number, required: true },
    center: { type: Number, required: true },
    max: { type: Number, required: true },
    current: { type: Number, default: null },
  },
  emits: ["update:min", "update:center", "update:max"],
  computed: {
    ticks(): Array<{ value: number; label: string }> {
      return [
        { value: -1, label: "-1" },
        { value: -0.5, label: "-0.5" },
        { value: 0, label: "0" },
        { value: 0.5, label: "0.5" },
        { value: 1, label: "1" },
      ];
    },
    minValue(): number {
      return this.clampValue(this.min);
    },
    centerValue(): number {
      return this.clampValue(this.center);
    },
    maxValue(): number {
      return this.clampValue(this.max);
    },
    currentValue(): number | null {
      if (this.current === null || this.current === undefined) return null;
      return this.clampValue(this.current);
    },
  },
  methods: {
    clampValue(value: number): number {
      if (!Number.isFinite(value)) return 0;
      return Math.max(-1, Math.min(1, value));
    },
    displayValue(value: number): string {
      return value.toFixed(2);
    },
    percentForValue(value: number): number {
      return (this.clampValue(value) + 1) * 50;
    },
    percentInputValue(value: number): number {
      return Math.round(this.clampValue(value) * 100);
    },
    eventValue(event: Event): number {
      return this.clampValue(
        Number((event.target as HTMLInputElement).value) / 100,
      );
    },
    setMin(event: Event) {
      this.$emit(
        "update:min",
        Math.min(this.eventValue(event), this.centerValue),
      );
    },
    setCenter(event: Event) {
      this.$emit("update:center", this.eventValue(event));
    },
    setMax(event: Event) {
      this.$emit(
        "update:max",
        Math.max(this.eventValue(event), this.centerValue),
      );
    },
  },
});
</script>

<style scoped>
.rc-calibration-control {
  width: 100%;
}

.rc-calibration-values {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.35rem;
  color: var(--bulma-text, #4a4a4a);
  font-weight: 600;
}

.rc-calibration-value.is-current {
  color: var(--bulma-danger, #ff3860);
}

.rc-calibration-track {
  position: relative;
  height: 1.75rem;
}

.rc-calibration-track::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 0.75rem;
  height: 0.35rem;
  border-radius: 999px;
  background: var(--bulma-border, #dbdbdb);
}

.rc-calibration-fill {
  position: absolute;
  top: 0.75rem;
  height: 0.35rem;
  border-radius: 999px;
  background: var(--bulma-primary, #00d1b2);
  z-index: 1;
}

.rc-calibration-center-line {
  position: absolute;
  left: 50%;
  top: 0.45rem;
  width: 1px;
  height: 0.95rem;
  background: rgba(0, 0, 0, 0.25);
  z-index: 1;
}

.rc-calibration-center,
.rc-calibration-current {
  position: absolute;
  transform: translateX(-50%);
  border-radius: 999px;
  box-shadow: 0 0 0 2px white;
  z-index: 2;
}

.rc-calibration-center {
  top: 0.29rem;
  width: 0.35rem;
  height: 1.28rem;
  background: var(--bulma-link, #485fc7);
}

.rc-calibration-current {
  top: 0.14rem;
  width: 0.25rem;
  height: 1.58rem;
  background: var(--bulma-danger, #ff3860);
}

.rc-calibration-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 1.75rem;
  margin: 0;
  appearance: none;
  background: transparent;
  pointer-events: none;
  z-index: 3;
}

.rc-calibration-input::-webkit-slider-runnable-track {
  height: 1.75rem;
  background: transparent;
}

.rc-calibration-input::-moz-range-track {
  height: 1.75rem;
  background: transparent;
}

.rc-calibration-input::-webkit-slider-thumb {
  appearance: none;
  pointer-events: auto;
  width: 1rem;
  height: 1rem;
  margin-top: 0.36rem;
  border: 2px solid var(--bulma-primary, #00d1b2);
  border-radius: 50%;
  background: white;
  cursor: grab;
}

.rc-calibration-input::-moz-range-thumb {
  pointer-events: auto;
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--bulma-primary, #00d1b2);
  border-radius: 50%;
  background: white;
  cursor: grab;
}

.rc-calibration-ticks {
  position: relative;
  height: 1.15rem;
  margin-top: 0.05rem;
  color: var(--bulma-text, #4a4a4a);
  font-weight: 600;
}

.rc-calibration-tick {
  position: absolute;
  transform: translateX(-50%);
}
</style>
