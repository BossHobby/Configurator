<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Elements</p>
      <tooltip class="card-header-icon" entry="osd.elements" size="lg" />
    </header>
    <div class="card-content">
      <div class="content">
        <div class="columns is-multiline">
          <div class="column is-6">
            <div class="field field-is-2 is-horizontal">
              <div class="field-label">
                <label class="label"> Callsign Text </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input class="input" type="text" v-model="callsign" />
                  </div>
                </div>
              </div>
            </div>

            <div class="columns mt-4 mb-0">
              <div
                class="column has-text-centered has-text-weight-semibold px-0 is-4"
              >
                Element
              </div>
              <div
                class="column has-text-left has-text-weight-semibold px-0 is-2"
              >
                Active
              </div>
              <div
                class="column has-text-left has-text-weight-semibold px-0 is-2"
              >
                Invert
              </div>
              <div
                class="column has-text-left has-text-weight-semibold px-0 is-2"
              >
                X
              </div>
              <div
                class="column has-text-left has-text-weight-semibold px-0 is-2"
              >
                Y
              </div>
            </div>

            <template v-for="(el, i) of elements" :key="i">
              <div
                v-if="el.enabled"
                class="field mb-2 field-is-2 is-horizontal"
              >
                <div class="field-label">
                  <label class="label" for="pid-preset">
                    {{ el.name }}
                  </label>
                </div>
                <div class="field-body">
                  <div class="field">
                    <div class="control is-expanded">
                      <input
                        :id="'active-' + i"
                        :name="'active-' + i"
                        type="checkbox"
                        class="switch"
                        :checked="el.active == 1"
                        @input="osd_set(i, 'active', !el.active)"
                      />
                      <label
                        class="py-0"
                        style="height: 2em"
                        :for="'active-' + i"
                      ></label>
                    </div>
                  </div>
                  <div class="field">
                    <div class="control is-expanded">
                      <input
                        :id="'invert-' + i"
                        :name="'invert-' + i"
                        type="checkbox"
                        class="switch"
                        :checked="el.invert == 1"
                        @input="osd_set(i, 'invert', !el.invert)"
                      />
                      <label
                        class="py-0"
                        style="height: 2em"
                        :for="'invert-' + i"
                      ></label>
                    </div>
                  </div>
                  <div class="field" style="align-self: center">
                    <div class="control is-expanded">
                      <input
                        class="input"
                        type="number"
                        step="1"
                        :value="el.pos.x"
                        min="0"
                        :max="limits.width - 1"
                        @input="osd_set(i, 'pos_x', $event?.target?.value)"
                      />
                    </div>
                  </div>
                  <div class="field" style="align-self: center">
                    <div class="control is-expanded">
                      <input
                        class="input"
                        type="number"
                        step="1"
                        :value="el.pos.y"
                        min="0"
                        :max="limits.height - 1"
                        @input="osd_set(i, 'pos_y', $event?.target?.value)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <div class="column is-6">
            <div class="card">
              <header class="card-header">
                <div class="card-header-title">
                  Preview
                  <div v-if="!is_hd" class="select ml-4">
                    <select v-model="preview">
                      <option>NTSC</option>
                      <option>PAL</option>
                    </select>
                  </div>
                </div>
              </header>
              <div class="card-content">
                <div class="content">
                  <canvas
                    :width="canvasWidth"
                    :height="canvasHeight"
                    ref="canvas"
                    class="osd-canvas"
                    @mousedown="drag_start"
                    @mousemove="drag_move"
                    @mouseup="drag_drop"
                    @mouseleave="drag_drop"
                  ></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { OSD } from "@/store/util/osd";
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
  setup() {
    return {
      profile: useProfileStore(),
      osd: useOSDStore(),
    };
  },
  data() {
    return {
      preview: "NTSC",
      drag: {
        element: -1,
        colOffset: 0,
        coord: { x: 0, y: 0 } as Coord2D,
      },
    };
  },
  computed: {
    is_hd() {
      return this.profile.serial.hdzero > 0;
    },
    currentElements() {
      return this.is_hd
        ? this.profile.osd.elements_hd
        : this.profile.osd.elements;
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
    canvasWidth() {
      return this.screen.width * OSD.CHAR_WIDTH;
    },
    canvasHeight() {
      return this.screen.height * OSD.CHAR_HEIGHT;
    },
    elementOptions() {
      const elements = [
        { name: "CALLSIGN", enabled: true, text: this.profile.osd.callsign },
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
      return elements;
    },
    elements() {
      return this.currentElements
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
              x: OSD.elementDecode(el, "pos_x"),
              y: OSD.elementDecode(el, "pos_y"),
            } as Coord2D,
            value: el,
          };
        });
    },
    callsign: {
      set(val) {
        let str = val.toUpperCase();
        for (let i = val.length; i < 36; i++) {
          str += "\0";
        }
        this.profile.osd.callsign = str;
      },
      get() {
        return this.profile.osd.callsign.replace(/\0/g, "");
      },
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
  methods: {
    translateMouse(evt: MouseEvent): Coord2D {
      return {
        x: evt.offsetX * (this.canvasWidth / this.canvas.clientWidth),
        y: evt.offsetY * (this.canvasHeight / this.canvas.clientHeight),
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
      this.osd_set(this.drag.element, "pos_x", coord.x);
      this.osd_set(this.drag.element, "pos_y", coord.y);
      this.canvas.style.cursor = "initial";
      this.drag = {
        element: -1,
        colOffset: 0,
        coord: { x: 0, y: 0 } as Coord2D,
      };
    },
    osd_set(i, attr, val) {
      const elements = this.is_hd
        ? this.profile.osd.elements_hd
        : this.profile.osd.elements;

      const copy: any[] = [...elements];
      copy[i] = OSD.elementEncode(elements[i], attr, val);

      if (this.is_hd) {
        this.profile.set_osd_elements_hd(copy);
      } else {
        this.profile.set_osd_elements(copy);
      }
    },
    draw_canvas_text(
      ctx: CanvasRenderingContext2D,
      coord: Coord2D,
      text: string,
      inverted: boolean,
    ) {
      let length = 0;
      for (let i = 0; i < text.length; i++) {
        let char = text.charCodeAt(i);
        if (char == 0) {
          break;
        }

        const charX = OSD.pixelsWidth(
          Math.floor(char % 16),
          OSD.BORDER,
          this.is_hd,
        );
        const charY = OSD.pixelsHeight(
          Math.floor(char / 16),
          OSD.BORDER,
          this.is_hd,
        );

        let bitmap: any = undefined;
        if (this.is_hd) {
          bitmap = this.osd.font_bitmap;
          char += 256;
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
            OSD.CHAR_WIDTH * (this.is_hd ? 2 : 1),
            OSD.CHAR_HEIGHT * (this.is_hd ? 2 : 1),
            coord.x + i * OSD.CHAR_WIDTH,
            coord.y,
            OSD.CHAR_WIDTH,
            OSD.CHAR_HEIGHT,
          );
        }

        length++;
      }

      ctx.strokeStyle = "#000";
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

      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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
  mounted() {
    Promise.resolve()
      .then(() => {
        if (this.is_hd) {
          return this.osd.fetch_hd_osd_font();
        }
      })
      .then((_) => this.draw_canvas());
  },
});
</script>

<style lang="scss" scoped>
.osd-canvas {
  width: 100%;
  background-image: url("@/assets/osd_background.jpg");
  background-attachment: local;
  background-size: cover;
}
</style>
