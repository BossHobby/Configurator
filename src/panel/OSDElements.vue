<template>
  <div class="space-y-4">
    <div class="grid gap-4 sm:grid-cols-3">
      <FieldSelect
        v-model="osdProfile"
        label="OSD profile"
        :options="
          osdProfileOptions.map((o) => ({ label: o.text, value: o.value }))
        "
      />
      <FieldSelect
        v-if="!is_hd"
        v-model="preview"
        label="Preview format"
        :options="[
          { label: 'NTSC', value: 'NTSC' },
          { label: 'PAL', value: 'PAL' },
        ]"
      />
      <div v-else>
        <p class="mb-1.5 text-xs text-muted">Display</p>
        <p class="rounded-md border border-line bg-subtle px-3 py-2 text-sm">
          Digital · {{ limits.width }} × {{ limits.height }}
        </p>
      </div>
      <label class="text-xs text-muted"
        >Callsign<input
          v-model="callsign"
          maxlength="36"
          class="mt-1.5 min-h-9 w-full rounded-md border border-line bg-subtle px-3 py-2 text-sm text-ink"
      /></label>
    </div>
    <div class="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <Panel
        title="Preview"
        description="Simulated OSD · drag an element to reposition it"
        class="flex flex-col"
      >
        <div class="flex flex-1 items-center justify-center min-h-0">
          <div class="osd-preview" :style="previewStyle">
            <canvas
              ref="canvas"
              :width="canvasWidth"
              :height="canvasHeight"
              class="osd-canvas"
              aria-label="OSD layout preview; use the position fields to move elements with the keyboard"
              @mousedown="drag_start"
              @mousemove="drag_move"
              @mouseup="drag_drop"
              @mouseleave="drag_drop"
            ></canvas>
          </div>
        </div>
      </Panel>
      <Panel
        title="Elements"
        :description="`${availableElements.length} available · ${availableElements.filter((el) => el.active).length} visible`"
      >
        <div
          class="grid grid-cols-1 gap-x-2 gap-y-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2"
        >
          <div
            v-for="el in availableElements"
            :key="el.index"
            class="flex items-center gap-2 rounded px-2 py-1"
            :class="selectedIndex === el.index ? 'bg-active' : ''"
          >
            <input
              type="checkbox"
              :checked="el.active === 1"
              :aria-label="'Show ' + el.name"
              class="size-4 accent-accent"
              @change="osd_set(el.index, 'active', !el.active)"
            />
            <button
              type="button"
              class="min-h-7 flex-1 text-left text-xs"
              :aria-pressed="selectedIndex === el.index"
              @click="selectedIndex = el.index"
            >
              {{ elementLabel(el.name) }}
            </button>
          </div>
        </div>
        <div
          v-if="selectedElement"
          class="mt-4 space-y-3 border-t border-line pt-4"
        >
          <h3 class="text-sm font-semibold capitalize">
            {{ elementLabel(selectedElement.name) }}
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <label class="text-xs text-muted"
              >Position X<input
                type="number"
                min="0"
                :max="limits.width - 1"
                step="1"
                :value="selectedElement.pos.x"
                class="mt-1 min-h-9 w-full rounded-md border border-line bg-subtle px-2 text-sm text-ink"
                @change="setPosition('x', $event)"
            /></label>
            <label class="text-xs text-muted"
              >Position Y<input
                type="number"
                min="0"
                :max="limits.height - 1"
                step="1"
                :value="selectedElement.pos.y"
                class="mt-1 min-h-9 w-full rounded-md border border-line bg-subtle px-2 text-sm text-ink"
                @change="setPosition('y', $event)"
            /></label>
          </div>
          <Toggle
            :model-value="selectedElement.invert === 1"
            label="Invert text"
            @update:model-value="osd_set(selectedIndex, 'invert', $event)"
          />
        </div>
      </Panel>
    </div>
  </div>
</template>

<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
import FieldSelect from "@/components/ui/Select.vue";
import Toggle from "@/components/ui/Toggle.vue";
import { defineComponent } from "vue";
import { OSD } from "@/store/util/osd";
import { useInfoStore } from "@/store/info";
import { useProfileStore } from "@/store/profile";
import { useOSDStore } from "@/store/osd";

interface Coord2D {
  x: number;
  y: number;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  return ctx;
}

export default defineComponent({
  name: "OSDElements",
  components: { Panel, FieldSelect, Toggle },
  setup() {
    return {
      info: useInfoStore(),
      profile: useProfileStore(),
      osd: useOSDStore(),
    };
  },
  data() {
    return {
      selectedIndex: 0,
      preview: "NTSC",
      osdProfile: 0,
      osdProfileOptions: [
        { text: "Profile 1", value: 0 },
        { text: "Profile 2", value: 1 },
      ],
      drag: {
        element: -1,
        colOffset: 0,
        coord: { x: 0, y: 0 } as Coord2D,
      },
    };
  },
  computed: {
    availableElements() {
      return this.elements.filter((el) => el.enabled);
    },
    selectedElement() {
      return this.elements.find((el) => el.index === this.selectedIndex);
    },
    is_hd() {
      return this.profile.serial.hdzero > 0;
    },
    currentProfile() {
      return this.profile.osd.profiles[this.osdProfile];
    },
    limits() {
      return {
        width: this.is_hd ? 50 : 30,
        height: this.is_hd ? 18 : 15,
      };
    },
    screen() {
      const screen = { ...this.limits };
      if (!this.is_hd && this.preview == "NTSC") {
        // NTSC has less lines
        screen.height -= 2;
      }
      return screen;
    },
    canvas() {
      return this.$refs.canvas as HTMLCanvasElement;
    },
    canvasScale() {
      return this.is_hd ? 2 : 1;
    },
    canvasWidth() {
      return this.screen.width * OSD.CHAR_WIDTH * this.canvasScale;
    },
    canvasHeight() {
      return this.screen.height * OSD.CHAR_HEIGHT * this.canvasScale;
    },
    elementOptions() {
      const elements = [
        { name: "CALLSIGN", enabled: true, text: this.callsign },
        { name: "CELL COUNT", enabled: true, text: "1S" },
        { name: "FUELGAUGE VOLTS", enabled: true, text: " 4.3\x70" },
        { name: "FILTERED VOLTS", enabled: true, text: " 4.3\x06" },
        { name: "GYRO TEMP", enabled: true, text: "  40\x0e" },
        { name: "FLIGHT MODE", enabled: true, text: "   ACRO   " },
        { name: "RSSI", enabled: true, text: "  90\x01" },
        { name: "STOPWATCH", enabled: true, text: "01:20" },
        {
          name: "SYSTEM STATUS",
          enabled: true,
          text: "     **FAILSAFE**     ",
        },
        { name: "THROTTLE", enabled: true, text: "  50\x04" },
        { name: "VTX CHANNEL", enabled: true, text: "R:7:1" },
        { name: "CURRENT", enabled: true, text: "0.00\x9a" },
      ];
      if (this.profile.profileVersionGt("0.2.2")) {
        elements.push({
          name: "CROSSHAIR",
          enabled: true,
          text: "\x72\x73\x74",
        });
      }
      if (this.profile.profileVersionGt("0.2.3")) {
        elements.push({
          name: "CURRENT DRAWN",
          enabled: true,
          text: "0.00\x07",
        });
      }
      if (this.profile.profileVersionGt("0.2.6")) {
        elements.push({
          name: "WATTS",
          enabled: true,
          text: " 0.0\x57",
        });
      }
      elements.push(
        { name: "GPS SATS", enabled: true, text: "\x1e\x1f 12" },
        { name: "GPS SPEED", enabled: true, text: " 45\x9e" },
      );
      elements.push({
        name: "INCLINOMETER",
        enabled: this.info.is_rover,
        text: "R 12P 18",
      });
      if (this.profile.profileVersionGt("0.3.0")) {
        elements.push({
          name: "CRSF TX POWER",
          enabled: true,
          text: "\x01250MW",
        });
      }
      elements.push(
        { name: "ALTITUDE", enabled: true, text: "\x7f 12.3\x0c" },
        { name: "GPS HOME", enabled: true, text: "\x05 42.0\x0c" },
      );
      return elements;
    },
    elements() {
      return this.currentProfile.elements
        .filter((el, i) => {
          return this.elementOptions[i];
        })
        .map((el, i) => {
          return {
            index: i,
            ...this.elementOptions[i],
            active: OSD.elementDecode(el, "active"),
            invert: OSD.elementDecode(el, "invert"),
            pos: {
              x: OSD.elementDecode(el, this.is_hd ? "pos_hd_x" : "pos_sd_x"),
              y: OSD.elementDecode(el, this.is_hd ? "pos_hd_y" : "pos_sd_y"),
            } as Coord2D,
            value: el,
          };
        });
    },
    elementColumns() {
      const enabled = this.elements.filter((el) => el.enabled);
      const middle = Math.ceil(enabled.length / 2);
      return [enabled.slice(0, middle), enabled.slice(middle)];
    },
    callsign: {
      set(val) {
        let str = val.toUpperCase();
        for (let i = val.length; i < 36; i++) {
          str += "\0";
        }
        this.profile.osd.profiles[this.osdProfile].callsign = str;
      },
      get() {
        return this.profile.osd.profiles[this.osdProfile].callsign.replace(
          /\0/g,
          "",
        );
      },
    },
    previewStyle() {
      const ratio = this.canvasWidth / this.canvasHeight;
      return {
        aspectRatio: `${this.canvasWidth} / ${this.canvasHeight}`,
        maxWidth: `min(100%, calc(min(45dvh, 420px) * ${ratio}))`,
      };
    },
  },
  watch: {
    elements() {
      this.draw_canvas();
    },
    drag() {
      this.draw_canvas();
    },
    canvasWidth() {
      this.$nextTick(() => {
        this.draw_canvas();
      });
    },
    canvasHeight() {
      this.$nextTick(() => {
        this.draw_canvas();
      });
    },
    "osd.font_bitmap"() {
      this.$nextTick(() => {
        this.draw_canvas();
      });
    },
  },
  mounted() {
    Promise.resolve()
      .then(() => {
        if (this.is_hd) {
          return this.osd.fetch_hd_osd_font();
        }
      })
      .then((_) => this.draw_canvas());
  },
  methods: {
    elementLabel(name: string) {
      const label = name
        .toLowerCase()
        .replace(/\b(rssi|gps|crsf|vtx|osd)\b/g, (acronym) =>
          acronym.toUpperCase(),
        );
      return label.charAt(0).toUpperCase() + label.slice(1);
    },
    translateMouse(evt: MouseEvent): Coord2D {
      return {
        x:
          evt.offsetX *
          (this.canvasWidth / this.canvas.clientWidth / this.canvasScale),
        y:
          evt.offsetY *
          (this.canvasHeight / this.canvas.clientHeight / this.canvasScale),
      };
    },
    translateElemement(coord: Coord2D): Coord2D {
      if (!this.is_hd && this.preview == "NTSC") {
        if (coord.y > 12) {
          coord.y -= 2;
        }
      }
      return {
        x: coord.x * OSD.CHAR_WIDTH,
        // simulate almost cut-off 0-th line
        y: OSD.CHAR_HEIGHT - 2 + (coord.y - 1) * OSD.CHAR_HEIGHT,
      };
    },
    normalizeCoords(coord: Coord2D, colOffset: number = 0): Coord2D {
      return {
        x: Math.min(
          Math.max(Math.floor((coord.x - colOffset) / OSD.CHAR_WIDTH), 0),
          this.limits.width - 1,
        ),
        y: Math.min(
          Math.max(Math.floor(coord.y / OSD.CHAR_HEIGHT), 0),
          this.limits.height - 1,
        ),
      };
    },
    drag_start(evt: MouseEvent) {
      evt.preventDefault();
      evt.stopPropagation();

      const mouse = this.translateMouse(evt);

      const el = this.findElement(mouse);
      if (el != null) {
        this.selectedIndex = el.index;
        const coord = this.translateElemement(el.pos);
        const colOffset = mouse.x - coord.x;
        this.drag = {
          element: el.index,
          colOffset,
          coord: this.normalizeCoords(mouse, colOffset),
        };
        this.canvas.style.cursor = "grab";
      }
    },
    drag_move(evt: MouseEvent) {
      evt.preventDefault();
      evt.stopPropagation();

      const mouse = this.translateMouse(evt);
      if (this.drag.element == -1) {
        const el = this.findElement(mouse);
        this.canvas.style.cursor = el != null ? "pointer" : "initial";
        return;
      }

      this.drag = {
        ...this.drag,
        coord: this.normalizeCoords(mouse, this.drag.colOffset),
      };
    },
    drag_drop(evt: MouseEvent) {
      evt.preventDefault();
      evt.stopPropagation();

      const mouse = this.translateMouse(evt);
      if (this.drag.element == -1) {
        return;
      }

      const coord = this.normalizeCoords(mouse, this.drag.colOffset);
      this.osd_set(
        this.drag.element,
        this.is_hd ? "pos_hd_x" : "pos_sd_x",
        coord.x,
      );
      this.osd_set(
        this.drag.element,
        this.is_hd ? "pos_hd_y" : "pos_sd_y",
        coord.y,
      );
      this.canvas.style.cursor = "initial";
      this.drag = {
        element: -1,
        colOffset: 0,
        coord: { x: 0, y: 0 } as Coord2D,
      };
    },
    setPosition(axis: "x" | "y", event: Event) {
      const value = (event.target as HTMLInputElement).valueAsNumber;
      if (!Number.isFinite(value)) return;
      const max = (axis === "x" ? this.limits.width : this.limits.height) - 1;
      this.osd_set(
        this.selectedIndex,
        `pos_${this.is_hd ? "hd" : "sd"}_${axis}`,
        Math.max(0, Math.min(max, Math.round(value))),
      );
    },
    osd_set(i, attr, val) {
      const elements = this.currentProfile.elements;

      const copy: any[] = [...elements];
      copy[i] = OSD.elementEncode(elements[i], attr, val);

      this.profile.osd.profiles[this.osdProfile] = {
        ...this.profile.osd.profiles[this.osdProfile],
        elements: copy,
      };
    },
    draw_canvas_text(
      ctx: CanvasRenderingContext2D,
      coord: Coord2D,
      text: string,
      inverted: boolean,
    ) {
      let length = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        if (char == 0) {
          break;
        }

        const charX = OSD.pixelsWidth(Math.floor(char % 16));
        const charY = OSD.pixelsHeight(Math.floor(char / 16));

        let bitmap: any = undefined;
        if (this.is_hd) {
          bitmap = this.osd.font_bitmap;
        } else {
          bitmap = inverted
            ? this.osd.font_bitmap_inverted
            : this.osd.font_bitmap;
        }

        if (bitmap) {
          ctx.drawImage(
            bitmap,
            charX,
            charY,
            OSD.CHAR_WIDTH,
            OSD.CHAR_HEIGHT,
            coord.x + i * OSD.CHAR_WIDTH,
            coord.y,
            OSD.CHAR_WIDTH,
            OSD.CHAR_HEIGHT,
          );
        }

        length++;
      }

      ctx.strokeStyle = "#526563";
      ctx.lineWidth = 1;
      roundRect(
        ctx,
        coord.x + 0.5,
        coord.y + 0.5,
        length * OSD.CHAR_WIDTH,
        OSD.CHAR_HEIGHT,
        1.5,
      );
      ctx.stroke();
    },
    draw_canvas() {
      const ctx = this.canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.setTransform(this.canvasScale, 0, 0, this.canvasScale, 0, 0);
      ctx.imageSmoothingEnabled = false;

      for (const [index, el] of this.elements.entries()) {
        if (!el.enabled || !el.active) {
          continue;
        }

        let pos = { ...el.pos };
        if (index == this.drag.element) {
          pos = { ...this.drag.coord };
        }

        this.draw_canvas_text(
          ctx,
          this.translateElemement(pos),
          el.text,
          el.invert == 1,
        );
      }
    },
    findElement(mouse: Coord2D) {
      for (const el of this.elements) {
        if (!el.enabled || !el.active) {
          continue;
        }

        const coord = this.translateElemement(el.pos);
        if (mouse.y < coord.y || mouse.y > coord.y + OSD.CHAR_HEIGHT) {
          continue;
        }

        let length = el.text.indexOf("\0");
        if (length == -1) {
          length = el.text.length;
        }
        if (mouse.x < coord.x || mouse.x > coord.x + length * OSD.CHAR_WIDTH) {
          continue;
        }

        return el;
      }

      return null;
    },
  },
});
</script>

<style lang="scss" scoped>
.osd-canvas {
  display: block;
  width: 100%;
  height: 100%;
  margin-inline: auto;
  background: #101a1c;
  border: 1px solid var(--ui-line);
  border-radius: 4px;
}
.osd-preview {
  width: 100%;
  margin-inline: auto;
}
</style>
