<template>
  <Panel title="Board Orientation">
    <template #actions>
      <UiButton v-if="hasHeading" @click="resetView">Reset view</UiButton>
      <SpinnerBtn @click="root.cal_imu()">Calibrate accelerometer</SpinnerBtn>
    </template>
    <div
      ref="container"
      class="h-64 w-full"
      role="img"
      :aria-label="`${vehicleLabel} at its current attitude`"
    ></div>
    <p v-if="unavailable" class="text-sm text-muted">
      The 3D view needs WebGL, which this browser does not provide.
    </p>
    <dl class="mt-3 grid grid-cols-3 gap-3 text-sm">
      <div v-for="value in readout" :key="value.label">
        <dt class="text-xs text-muted">{{ value.label }}</dt>
        <dd class="font-medium tabular-nums">
          {{ value.text }}
          <span v-if="value.note" class="text-xs font-normal text-muted">{{
            value.note
          }}</span>
        </dd>
      </div>
    </dl>
  </Panel>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Panel from "@/components/ui/Panel.vue";
import UiButton from "@/components/ui/Button.vue";
import SpinnerBtn from "@/components/SpinnerBtn.vue";
import { useInfoStore } from "@/store/info";
import { useProfileStore } from "@/store/profile";
import { useRootStore } from "@/store/root";
import { useStateStore } from "@/store/state";
import { output_source_t } from "@/store/types";
import { AttitudeScene, type Attitude } from "@/ui/attitudeScene";
import type { VehicleKind } from "@/ui/attitudeModels";

const info = useInfoStore();
const profile = useProfileStore();
const root = useRootStore();
const state = useStateStore();

const container = ref<HTMLElement>();
const unavailable = ref(false);
// The heading the view looks along; unset until the first sample arrives.
const viewYaw = ref<number>();

let scene: AttitudeScene | undefined;
let resizeObserver: ResizeObserver | undefined;
let themeObserver: MutationObserver | undefined;

const vehicle = computed<VehicleKind>(() => {
  if (info.is_rover) return "rover";
  if (!info.is_wing) return "quad";
  // A rudder means a tail; without one the elevons make it a flying wing.
  const rudder = profile.mixer?.some(
    (rule) => rule.source == output_source_t.OUTPUT_SOURCE_YAW,
  );
  return rudder ? "plane" : "wing";
});

const vehicleLabel = computed(
  () =>
    ({
      quad: "Quadcopter",
      wing: "Flying wing",
      plane: "Plane",
      rover: "Rover",
    })[vehicle.value],
);

// The firmware only estimates a heading with a GPS configured; yaw stays
// zero otherwise.
const hasHeading = computed(
  () => (state.attitude as number[]).length == 3 && profile.serial?.gps != 0,
);

const attitude = computed<Attitude | undefined>(() => {
  const a = state.attitude as number[];
  if (a.length == 3) return { roll: a[0], pitch: a[1], yaw: a[2] };
  // Firmware without state.attitude: tilt from the gravity vector, as the
  // firmware derives it.
  const g = state.GEstG as number[] | null;
  if (!g) return undefined;
  return {
    roll: Math.atan2(g[0], g[2]),
    pitch: Math.atan2(g[1], Math.hypot(g[0], g[2])),
    yaw: 0,
  };
});

const degrees = (rad: number) => `${Math.round((rad * 180) / Math.PI)}°`;

const readout = computed(() => {
  const a = attitude.value;
  return [
    { label: "Roll", text: a ? degrees(a.roll) : "–" },
    // Shown nose-up positive; the firmware counts nose-down.
    { label: "Pitch", text: a ? degrees(-a.pitch || 0) : "–" },
    {
      label: "Heading",
      text:
        a && hasHeading.value
          ? degrees((a.yaw + 2 * Math.PI) % (2 * Math.PI))
          : "–",
      // Gyro-integrated from an arbitrary start until GPS corrects it in flight.
      note: hasHeading.value && !state.heading_confidence ? "unconfirmed" : "",
    },
  ];
});

function resetView() {
  viewYaw.value = attitude.value?.yaw ?? 0;
}

function update() {
  const a = attitude.value;
  if (!scene || !a) return;
  if (viewYaw.value == undefined) viewYaw.value = a.yaw;
  scene.setViewYaw(viewYaw.value);
  scene.setNorth(hasHeading.value && state.heading_confidence > 0);
  scene.setAttitude(a);
}

onMounted(() => {
  if (!container.value) return;
  try {
    scene = new AttitudeScene(container.value);
  } catch {
    unavailable.value = true;
    return;
  }
  scene.setVehicle(vehicle.value);
  update();

  resizeObserver = new ResizeObserver(() => scene?.resize());
  resizeObserver.observe(container.value);
  themeObserver = new MutationObserver(() => scene?.setTheme());
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  themeObserver?.disconnect();
  scene?.dispose();
});

watch(vehicle, (kind) => scene?.setVehicle(kind));
watch([attitude, viewYaw, hasHeading, () => state.heading_confidence], update);
</script>
