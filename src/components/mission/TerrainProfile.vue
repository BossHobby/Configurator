<template>
  <figure class="flex flex-col gap-2">
    <figcaption class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      <span class="flex items-center gap-1.5 text-muted">
        <span class="h-0.5 w-4 rounded-full bg-accent" aria-hidden="true" />
        Planned altitude
      </span>
      <span class="flex items-center gap-1.5 text-muted">
        <span
          class="h-2.5 w-4 rounded-sm border-t-2 border-muted bg-muted/20"
          aria-hidden="true"
        />
        Ground
      </span>
      <span
        v-if="lowRanges.length"
        class="flex items-center gap-1.5 text-muted"
      >
        <span class="h-2.5 w-4 rounded-sm bg-danger/15" aria-hidden="true" />
        Under {{ warnClearance }} m clearance
      </span>
    </figcaption>
    <div ref="box" class="relative h-44" @pointerleave="hover = undefined">
      <svg
        v-if="width && profile.length > 1"
        :width="width"
        :height="height"
        class="block touch-none select-none"
        role="img"
        :aria-label="summary"
        @pointermove="onPointer"
        @pointerdown="onPointer"
      >
        <g class="text-[10px]" fill="currentColor">
          <g v-for="tick in yTicks" :key="`y${tick}`">
            <line
              :x1="pad.left"
              :x2="width - pad.right"
              :y1="y(tick)"
              :y2="y(tick)"
              class="stroke-line"
              stroke-width="1"
              shape-rendering="crispEdges"
            />
            <text
              :x="pad.left - 6"
              :y="y(tick)"
              text-anchor="end"
              dominant-baseline="middle"
              class="fill-muted tabular-nums"
            >
              {{ tick }}
            </text>
          </g>
          <text
            v-for="tick in xTicks"
            :key="`x${tick}`"
            :x="x(tick)"
            :y="height - 4"
            text-anchor="middle"
            class="fill-muted tabular-nums"
          >
            {{ formatTick(tick) }}
          </text>
        </g>
        <rect
          v-for="(range, i) in lowRanges"
          :key="`low${i}`"
          :x="x(range[0])"
          :y="pad.top"
          :width="Math.max(x(range[1]) - x(range[0]), 2)"
          :height="height - pad.top - pad.bottom"
          class="fill-danger/15"
        />
        <path :d="groundArea" class="fill-muted/20" />
        <path
          :d="groundLine"
          class="stroke-muted"
          fill="none"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
        <path
          :d="flightLine"
          class="stroke-accent"
          fill="none"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <g v-for="mark in marks" :key="`wp${mark.index}`">
          <circle
            :cx="x(mark.d)"
            :cy="y(mark.alt)"
            r="5"
            class="fill-accent stroke-panel"
            stroke-width="2"
          />
          <text
            v-if="mark.label"
            :x="x(mark.d)"
            :y="y(mark.alt) - 9"
            text-anchor="middle"
            class="fill-ink stroke-panel text-[10px] font-semibold"
            stroke-width="3"
            paint-order="stroke"
          >
            {{ mark.index + 1 }}
          </text>
        </g>
        <g v-if="hovered">
          <line
            :x1="x(hovered.d)"
            :x2="x(hovered.d)"
            :y1="pad.top"
            :y2="height - pad.bottom"
            class="stroke-ink/40"
            stroke-width="1"
          />
          <circle
            :cx="x(hovered.d)"
            :cy="y(hovered.flight)"
            r="4"
            class="fill-accent stroke-panel"
            stroke-width="2"
          />
          <circle
            :cx="x(hovered.d)"
            :cy="y(hovered.ground)"
            r="4"
            class="fill-muted stroke-panel"
            stroke-width="2"
          />
        </g>
      </svg>
      <div
        v-if="hovered"
        class="pointer-events-none absolute top-1 z-10 rounded-md border border-line bg-panel px-2.5 py-1.5 text-xs whitespace-nowrap shadow-sm tabular-nums"
        :style="tooltipStyle"
      >
        <div class="mb-0.5 text-muted">{{ formatDistance(hovered.d) }}</div>
        <div class="flex items-center gap-1.5">
          <span class="h-0.5 w-3 rounded-full bg-accent" />
          <span class="font-semibold">{{ Math.round(hovered.flight) }} m</span>
          <span class="text-muted">planned</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="h-0.5 w-3 rounded-full bg-muted" />
          <span class="font-semibold">{{ Math.round(hovered.ground) }} m</span>
          <span class="text-muted">ground</span>
        </div>
        <div
          class="mt-0.5"
          :class="
            hovered.flight - hovered.ground < warnClearance
              ? 'text-danger'
              : 'text-muted'
          "
        >
          {{
            hovered.flight >= hovered.ground
              ? `${Math.round(hovered.flight - hovered.ground)} m above ground`
              : `${Math.round(hovered.ground - hovered.flight)} m into the ground`
          }}
        </div>
      </div>
    </div>
  </figure>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { formatDistance, type PathVertex } from "@/store/util/mission";
import type { ProfileSample } from "@/store/util/terrain";

const props = defineProps<{
  profile: ProfileSample[];
  path: PathVertex[];
  warnClearance: number;
  // Samples before this distance are the climb out, not checked.
  takeoff: number;
}>();

const box = ref<HTMLElement>();
const width = ref(0);
const height = 176;
const pad = { top: 16, right: 12, bottom: 20, left: 40 };
const hover = ref<number>();

let observer: ResizeObserver | undefined;
onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    width.value = entry.contentRect.width;
  });
  observer.observe(box.value!);
});
onUnmounted(() => observer?.disconnect());

const length = computed(() => props.profile[props.profile.length - 1]?.d ?? 0);

function niceStep(span: number, count: number) {
  const raw = span / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const unit = [1, 2, 5, 10].find((m) => m * pow >= raw)!;
  return unit * pow;
}

const yRange = computed(() => {
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of props.profile) {
    lo = Math.min(lo, s.ground, s.flight);
    hi = Math.max(hi, s.ground, s.flight);
  }
  for (const v of props.path) hi = Math.max(hi, v.alt);
  const step = niceStep(Math.max(hi - lo, 10), 4);
  return {
    lo: Math.floor(lo / step) * step,
    hi: Math.ceil((hi + step * 0.25) / step) * step,
    step,
  };
});

const yTicks = computed(() => {
  const { lo, hi, step } = yRange.value;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v));
  return ticks;
});

const xTicks = computed(() => {
  if (!width.value || !length.value) return [];
  const count = Math.max(2, Math.floor((width.value - pad.left) / 90));
  const step = niceStep(length.value, count);
  const ticks = [];
  for (let d = 0; d <= length.value; d += step) ticks.push(d);
  return ticks;
});

function x(d: number) {
  return (
    pad.left +
    (length.value
      ? (d / length.value) * (width.value - pad.left - pad.right)
      : 0)
  );
}

function y(alt: number) {
  const { lo, hi } = yRange.value;
  return pad.top + ((hi - alt) / (hi - lo)) * (height - pad.top - pad.bottom);
}

function formatTick(d: number) {
  if (length.value >= 2000) return `${+(d / 1000).toFixed(1)} km`;
  return `${Math.round(d)} m`;
}

const groundLine = computed(() =>
  props.profile
    .map(
      (s, i) =>
        `${i ? "L" : "M"}${x(s.d).toFixed(1)},${y(s.ground).toFixed(1)}`,
    )
    .join(""),
);

const groundArea = computed(() => {
  const bottom = (height - pad.bottom).toFixed(1);
  return `${groundLine.value}L${x(length.value).toFixed(1)},${bottom}L${x(0).toFixed(1)},${bottom}Z`;
});

const flightLine = computed(() =>
  props.path
    .map(
      (v, i) => `${i ? "L" : "M"}${x(v.d).toFixed(1)},${y(v.alt).toFixed(1)}`,
    )
    .join(""),
);

// Number every waypoint while they have room, else only some.
const marks = computed(() => {
  const points = props.path.filter((v) => v.index !== undefined);
  const room = (width.value - pad.left - pad.right) / 18;
  const every = Math.max(1, Math.ceil(points.length / Math.max(room, 1)));
  return points.map((v) => ({
    d: v.d,
    alt: v.alt,
    index: v.index!,
    label: v.index! % every == 0 || v.index == points.length - 1,
  }));
});

// Stretches with too little clearance, merged across adjacent samples.
const lowRanges = computed(() => {
  const ranges: [number, number][] = [];
  const samples = props.profile;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    if (s.d <= props.takeoff || s.flight - s.ground >= props.warnClearance)
      continue;
    const last = ranges[ranges.length - 1];
    const start = i ? (samples[i - 1].d + s.d) / 2 : s.d;
    const end = i + 1 < samples.length ? (samples[i + 1].d + s.d) / 2 : s.d;
    if (last && start <= last[1]) last[1] = end;
    else ranges.push([start, end]);
  }
  return ranges;
});

const summary = computed(() => {
  let lowest: ProfileSample | undefined;
  for (const s of props.profile) {
    if (s.d <= props.takeoff) continue;
    if (!lowest || s.flight - s.ground < lowest.flight - lowest.ground)
      lowest = s;
  }
  return lowest
    ? `Terrain profile along ${formatDistance(length.value)} of route. Lowest clearance ${Math.round(lowest.flight - lowest.ground)} m at ${formatDistance(lowest.d)}.`
    : "Terrain profile";
});

function onPointer(event: PointerEvent) {
  const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
  const px = event.clientX - rect.left;
  const d =
    ((px - pad.left) / (width.value - pad.left - pad.right)) * length.value;
  // Snap to the nearest sample.
  let best = 0;
  props.profile.forEach((s, i) => {
    if (Math.abs(s.d - d) < Math.abs(props.profile[best].d - d)) best = i;
  });
  hover.value = best;
}

const hovered = computed(() =>
  hover.value === undefined ? undefined : props.profile[hover.value],
);

const tooltipStyle = computed(() => {
  if (!hovered.value) return {};
  const px = x(hovered.value.d);
  // Flip to the left of the crosshair past the middle.
  return px > width.value / 2
    ? { right: `${width.value - px + 10}px` }
    : { left: `${px + 10}px` };
});
</script>
