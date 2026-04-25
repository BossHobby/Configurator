<template>
  <div class="aux-range-control">
    <div class="aux-range-values is-size-7 has-text-grey">
      <span>{{ minPercent }}%</span>
      <span v-if="currentPercent !== null">Current {{ currentPercent }}%</span>
      <span>{{ maxPercent }}%</span>
    </div>

    <div ref="track" class="aux-range-track">
      <div
        class="aux-range-fill"
        :style="{
          left: `${minPercent}%`,
          width: `${maxPercent - minPercent}%`,
        }"
        @pointerdown.stop.prevent="startRangeDrag($event)"
      ></div>
      <div
        v-if="currentPercent !== null"
        class="aux-range-current"
        :class="{ 'is-active': currentInRange }"
        :style="{ left: `${currentPercent}%` }"
      ></div>

      <input
        class="aux-range-input"
        type="range"
        min="0"
        max="100"
        :value="minPercent"
        @input="setMin($event)"
      />
      <input
        class="aux-range-input"
        type="range"
        min="0"
        max="100"
        :value="maxPercent"
        @input="setMax($event)"
      />
    </div>

    <div class="aux-range-ticks is-size-7">
      <span
        v-for="tick in ticks"
        :key="tick"
        class="aux-range-tick"
        :style="{ left: `${tick}%` }"
      >
        {{ tick }}%
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "AuxRangeControl",
  props: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    current: { type: Number, default: null },
  },
  emits: ["update:min", "update:max"],
  data() {
    return {
      draggingRange: false,
      dragOffset: 0,
      dragWidth: 0,
    };
  },
  computed: {
    ticks(): number[] {
      return [0, 25, 50, 75, 100];
    },
    minPercent(): number {
      return this.clampPercent(Math.min(this.min, this.max));
    },
    maxPercent(): number {
      return this.clampPercent(Math.max(this.min, this.max));
    },
    currentPercent(): number | null {
      if (this.current === null || this.current === undefined) return null;
      return this.clampPercent(this.current);
    },
    currentInRange(): boolean {
      return (
        this.currentPercent !== null &&
        this.currentPercent >= this.minPercent &&
        this.currentPercent <= this.maxPercent
      );
    },
  },
  beforeUnmount() {
    this.stopRangeDrag();
  },
  methods: {
    clampPercent(value: number): number {
      if (!Number.isFinite(value)) return 0;
      return Math.max(0, Math.min(100, Math.round(value)));
    },
    eventValue(event: Event): number {
      return parseInt((event.target as HTMLInputElement).value, 10);
    },
    setMin(event: Event) {
      this.$emit(
        "update:min",
        Math.min(this.eventValue(event), this.maxPercent),
      );
    },
    setMax(event: Event) {
      this.$emit(
        "update:max",
        Math.max(this.eventValue(event), this.minPercent),
      );
    },
    trackPercent(clientX: number): number {
      const track = this.$refs.track as HTMLElement | undefined;
      if (!track) return 0;
      const rect = track.getBoundingClientRect();
      return this.clampPercent(((clientX - rect.left) / rect.width) * 100);
    },
    startRangeDrag(event: PointerEvent) {
      const startPercent = this.trackPercent(event.clientX);
      this.draggingRange = true;
      this.dragOffset = startPercent - this.minPercent;
      this.dragWidth = this.maxPercent - this.minPercent;
      window.addEventListener("pointermove", this.moveRangeDrag);
      window.addEventListener("pointerup", this.stopRangeDrag);
      window.addEventListener("pointercancel", this.stopRangeDrag);
    },
    moveRangeDrag(event: PointerEvent) {
      if (!this.draggingRange) return;
      const nextMin = Math.max(
        0,
        Math.min(
          100 - this.dragWidth,
          this.trackPercent(event.clientX) - this.dragOffset,
        ),
      );
      this.$emit("update:min", Math.round(nextMin));
      this.$emit("update:max", Math.round(nextMin + this.dragWidth));
    },
    stopRangeDrag() {
      this.draggingRange = false;
      window.removeEventListener("pointermove", this.moveRangeDrag);
      window.removeEventListener("pointerup", this.stopRangeDrag);
      window.removeEventListener("pointercancel", this.stopRangeDrag);
    },
  },
});
</script>

<style scoped>
.aux-range-control {
  width: 100%;
}

.aux-range-values {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.35rem;
}

.aux-range-track {
  position: relative;
  height: 1.75rem;
}

.aux-range-track::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 0.75rem;
  height: 0.35rem;
  border-radius: 999px;
  background: var(--bulma-border, #dbdbdb);
}

.aux-range-fill {
  position: absolute;
  top: 0.75rem;
  height: 0.35rem;
  border-radius: 999px;
  background: var(--bulma-primary, #00d1b2);
  cursor: grab;
  z-index: 1;
}

.aux-range-fill:active {
  cursor: grabbing;
}

.aux-range-current {
  position: absolute;
  top: 0.34rem;
  width: 0.25rem;
  height: 1.18rem;
  transform: translateX(-50%);
  border-radius: 999px;
  background: var(--bulma-danger, #ff3860);
  box-shadow: 0 0 0 2px white;
  z-index: 2;
}

.aux-range-current.is-active {
  background: var(--bulma-success, #48c78e);
}

.aux-range-input {
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

.aux-range-input::-webkit-slider-runnable-track {
  height: 1.75rem;
  background: transparent;
}

.aux-range-input::-moz-range-track {
  height: 1.75rem;
  background: transparent;
}

.aux-range-input::-webkit-slider-thumb {
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

.aux-range-input::-moz-range-thumb {
  pointer-events: auto;
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--bulma-primary, #00d1b2);
  border-radius: 50%;
  background: white;
  cursor: grab;
}

.aux-range-ticks {
  position: relative;
  height: 1rem;
  margin-top: 0.1rem;
  color: var(--bulma-text, currentColor);
}

.aux-range-tick {
  position: absolute;
  transform: translateX(-50%);
  white-space: nowrap;
}

.aux-range-tick::before {
  content: "";
  position: absolute;
  left: 50%;
  top: -0.45rem;
  height: 0.3rem;
  border-left: 1px solid var(--bulma-border, #dbdbdb);
}
</style>
