<script setup lang="ts">
import { computed, ref } from "vue";
import Panel from "./Panel.vue";
import Field from "./Field.vue";
import Select from "./Select.vue";
import Toggle from "./Toggle.vue";
import { osdPosition, type OsdMock, type OsdElement } from "../../ui/osd";
const props = defineProps<{ modelValue: OsdMock }>();
const emit = defineEmits<{ "update:modelValue": [value: OsdMock] }>();
const selectedId = ref("battery");
const canvas = ref<HTMLElement>();
const selected = computed(
  () => props.modelValue.elements.find((e) => e.id === selectedId.value)!,
);
const showGrid = ref(true);
function label(e: OsdElement) {
  return e.id === "callsign" ? props.modelValue.callsign || " " : e.text;
}
function patch(id: string, values: Partial<OsdElement>) {
  emit("update:modelValue", {
    ...props.modelValue,
    elements: props.modelValue.elements.map((e) =>
      e.id === id ? { ...e, ...values } : e,
    ),
  });
}
function position(e: OsdElement, x: number, y: number) {
  patch(e.id, osdPosition(x, y, label(e).length));
}
function callsign(value: string | number | null) {
  const next = String(value ?? "")
    .toUpperCase()
    .slice(0, 20);
  emit("update:modelValue", {
    ...props.modelValue,
    callsign: next,
    elements: props.modelValue.elements.map((e) =>
      e.id === "callsign" ? { ...e, ...osdPosition(e.x, e.y, next.length) } : e,
    ),
  });
}
let drag:
  | {
      id: string;
      pointer: number;
      x: number;
      y: number;
      startX: number;
      startY: number;
    }
  | undefined;
function start(e: OsdElement, event: PointerEvent) {
  if (event.button !== 0) return;
  selectedId.value = e.id;
  drag = {
    id: e.id,
    pointer: event.pointerId,
    x: e.x,
    y: e.y,
    startX: event.clientX,
    startY: event.clientY,
  };
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}
function move(event: PointerEvent) {
  if (!drag || drag.pointer !== event.pointerId || !canvas.value) return;
  const bounds = canvas.value.getBoundingClientRect();
  const e = props.modelValue.elements.find((e) => e.id === drag!.id)!;
  position(
    e,
    drag.x + ((event.clientX - drag.startX) / bounds.width) * 30,
    drag.y + ((event.clientY - drag.startY) / bounds.height) * 16,
  );
}
function key(e: OsdElement, event: KeyboardEvent) {
  const offsets: Record<string, [number, number]> = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  };
  const offset = offsets[event.key];
  if (!offset) return;
  event.preventDefault();
  position(e, e.x + offset[0], e.y + offset[1]);
}
</script>
<template>
  <div class="mb-4 grid gap-4 sm:grid-cols-3">
    <Select
      :model-value="1"
      label="OSD profile"
      :options="[{ label: 'Profile 1', value: 1 }]"
      disabled
    />
    <Select
      model-value="analog"
      label="Display"
      :options="[{ label: 'Analog · 30 × 16', value: 'analog' }]"
      disabled
    />
    <Field
      :model-value="modelValue.callsign"
      label="Callsign"
      maxlength="20"
      @update:model-value="callsign"
    />
  </div>
  <div class="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
    <Panel
      title="Preview"
      description="Mock display · Drag an element or use arrow keys."
    >
      <template #actions><span class="text-xs text-muted">4:3</span></template>
      <div
        ref="canvas"
        class="ui-osd relative aspect-[4/3] w-full overflow-hidden rounded-md bg-[#111b1d]"
        :class="showGrid ? 'ui-osd-grid' : ''"
        aria-label="OSD preview, 30 columns by 16 rows"
      >
        <button
          v-for="element in modelValue.elements.filter((e) => e.enabled)"
          :key="element.id"
          type="button"
          :aria-label="
            element.label +
            ', column ' +
            element.x +
            ', row ' +
            element.y +
            '. Use arrow keys to move.'
          "
          :aria-pressed="selectedId === element.id"
          class="absolute flex h-[6.25%] touch-none items-center whitespace-pre font-mono leading-none tracking-normal outline-offset-0"
          :class="[
            element.invert ? 'bg-white text-black' : 'text-white',
            selectedId === element.id ? 'outline-2 outline-accent' : '',
            'cursor-move',
          ]"
          :style="{
            left: (element.x / 30) * 100 + '%',
            top: (element.y / 16) * 100 + '%',
            width: (Math.max(1, label(element).length) / 30) * 100 + '%',
            fontSize: '4cqw',
          }"
          @click="selectedId = element.id"
          @pointerdown="start(element, $event)"
          @pointermove="move"
          @pointerup="drag = undefined"
          @pointercancel="drag = undefined"
          @lostpointercapture="drag = undefined"
          @keydown="key(element, $event)"
        >
          <span
            v-for="(character, index) in label(element)"
            :key="index"
            class="flex-1 text-center"
            >{{ character }}</span
          >
        </button>
      </div>
      <div class="mt-3">
        <Toggle v-model="showGrid" label="Character grid" />
      </div>
    </Panel>
    <Panel title="Elements">
      <div class="space-y-1">
        <div
          v-for="element in modelValue.elements"
          :key="element.id"
          class="flex items-center gap-3 rounded-md px-2"
          :class="selectedId === element.id ? 'bg-active' : ''"
        >
          <input
            :id="'osd-' + element.id"
            type="checkbox"
            :checked="element.enabled"
            :aria-label="'Show ' + element.label"
            class="size-4 shrink-0 accent-accent"
            @change="
              patch(element.id, {
                enabled: ($event.target as HTMLInputElement).checked,
              })
            "
          /><button
            type="button"
            class="min-h-10 flex-1 py-2 text-left text-sm"
            :aria-pressed="selectedId === element.id"
            @click="selectedId = element.id"
          >
            {{ element.label }}
          </button>
        </div>
      </div>
      <div class="mt-4 border-t border-line pt-4">
        <h3 class="mb-3 text-sm font-semibold capitalize">
          {{ selected.label }}
        </h3>
        <div class="mb-3 grid grid-cols-2 gap-3">
          <Field
            :model-value="selected.x"
            type="number"
            label="Column (X)"
            min="0"
            :max="30 - label(selected).length"
            step="1"
            @update:model-value="
              (value) =>
                value !== null && position(selected, Number(value), selected.y)
            "
          /><Field
            :model-value="selected.y"
            type="number"
            label="Row (Y)"
            min="0"
            max="15"
            step="1"
            @update:model-value="
              (value) =>
                value !== null && position(selected, selected.x, Number(value))
            "
          />
        </div>
        <Toggle
          :model-value="selected.invert"
          label="Invert"
          @update:model-value="patch(selected.id, { invert: $event })"
        />
      </div>
    </Panel>
  </div>
</template>
<style scoped>
.ui-osd {
  container-type: inline-size;
}
/* Functional character grid only; all application surfaces remain solid. */
.ui-osd-grid {
  background-image:
    linear-gradient(to right, #ffffff12 1px, transparent 1px),
    linear-gradient(to bottom, #ffffff12 1px, transparent 1px);
  background-size: calc(100% / 30) calc(100% / 16);
}
.ui-osd button {
  min-height: 0;
  padding: 0;
  border: 0;
}
</style>
