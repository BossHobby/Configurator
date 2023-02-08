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
                        :value="el.pos_x"
                        min="0"
                        :max="screen.width - 1"
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
                        :value="el.pos_y"
                        min="0"
                        :max="screen.height - 1"
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
                <p class="card-header-title">Preview</p>
              </header>
              <div class="card-content">
                <div class="content">
                  <canvas
                    :width="svg_width"
                    :height="svg_height"
                    ref="canvas"
                    style="width: 100%"
                    class="osd-canvas"
                  ></canvas>

                  <svg
                    :viewBox="viewBox"
                    xmlns="http://www.w3.org/2000/svg"
                    ref="svg_scene"
                    @mousedown="drag_start"
                    @mousemove="drag_move"
                    @mouseup="drag_drop"
                    @mouseleave="drag_drop"
                  >
                    <g v-for="(el, i) of elements" :key="i">
                      <g
                        class="text-group"
                        v-if="el.enabled && el.active"
                        :index="i"
                        :transform="svg_group_transform(el)"
                      >
                        <text
                          v-for="(c, ci) of el.text"
                          :class="{ 'text-invert': el.invert }"
                          :key="'el-' + i + '-' + ci"
                          :x="ci * screen.char_width"
                        >
                          {{ c }}
                        </text>
                      </g>
                    </g>
                  </svg>
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

export default defineComponent({
  name: "OSDElements",
  setup() {
    return {
      profile: useProfileStore(),
      osd: useOSDStore(),
      dragInfo: {
        element: null,
        grabOffset: { x: 0, y: 0 },
      },
    };
  },
  computed: {
    is_hd() {
      return this.profile.serial.hdzero;
    },
    currentElements() {
      return this.is_hd
        ? this.profile.osd.elements_hd
        : this.profile.osd.elements;
    },
    screen() {
      return {
        width: this.is_hd ? 50 : 30,
        height: this.is_hd ? 18 : 15,
        char_width: 12,
        char_height: 18,
      };
    },
    canvas() {
      return this.$refs.canvas as HTMLCanvasElement;
    },
    svg_width() {
      return this.screen.width * this.screen.char_width;
    },
    svg_height() {
      return this.screen.height * this.screen.char_height;
    },
    viewBox() {
      return `0 0 ${this.svg_width} ${this.svg_height}`;
    },
    element_options() {
      return [
        { name: "CALLSIGN", enabled: true, text: this.profile.osd.callsign },
        { name: "CELL COUNT", enabled: true, text: "1S" },
        { name: "FUELGAUGE VOLTS", enabled: true, text: " 4.3V" },
        { name: "FILTERED VOLTS", enabled: true, text: " 4.3V" },
        { name: "GYRO TEMP", enabled: true, text: "  40\x0e" },
        { name: "FLIGHT MODE", enabled: true, text: "   ACRO   " },
        { name: "RSSI", enabled: true, text: "  90\x01" },
        { name: "STOPWATCH", enabled: true, text: "01:20" },
        { name: "SYSTEM STATUS", enabled: true, text: "  **ARMED**    " },
        { name: "THROTTLE", enabled: true, text: "  50\x04" },
        { name: "VTX CHANNEL", enabled: true, text: "R:7:1" },
        { name: "CURRENT", enabled: true, text: "0.00\x9a" },
      ];
    },
    elements() {
      return this.currentElements
        .filter((el, i) => {
          return this.element_options[i];
        })
        .map((el, i) => {
          return {
            ...this.element_options[i],
            active: this.osd_decode(el, "active"),
            invert: this.osd_decode(el, "invert"),
            pos_x: this.osd_decode(el, "pos_x"),
            pos_y: this.osd_decode(el, "pos_y"),
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
  },
  methods: {
    svg_group_transform(el) {
      return this.grid_translate(el.pos_x, el.pos_y);
    },
    grid_translate(gridX, gridY) {
      return `translate(${gridX * this.screen.char_width} ${
        gridY * (this.screen.char_height - 1)
      })`;
    },
    drag_start(evt) {
      if (evt.target.classList.contains("text-group")) {
        const pointer = OSD.svgPointerCoords(this.$refs.svg_scene, evt);
        const translate = OSD.svgTranslate(evt.target);
        this.dragInfo = {
          element: evt.target,
          grabOffset: {
            x: pointer.x - translate.x,
            y: pointer.y - translate.y,
          },
        };
      }
    },
    drag_move(evt) {
      if (this.dragInfo.element) {
        const pointer = OSD.svgPointerCoords(this.$refs.svg_scene, evt);
        var tx = pointer.x - this.dragInfo.grabOffset.x;
        var ty = pointer.y - this.dragInfo.grabOffset.y;
        const tx_max = this.svg_width - this.screen.char_width;
        if (tx < 0) {
          tx = 0;
        } else if (tx > tx_max) {
          tx = tx_max;
        }
        if (ty < 0) {
          ty = 0;
        } else if (ty > this.svg_height) {
          ty = this.svg_height;
        }
        this.dragInfo.element.setAttributeNS(
          null,
          "transform",
          `translate(${tx} ${ty})`
        );
      }
    },
    drag_drop(evt) {
      if (this.dragInfo.element) {
        const translate = OSD.svgTranslate(this.dragInfo.element);
        const dropX = Math.min(
          this.screen.width - 1,
          Math.round(translate.x / this.screen.char_width)
        );
        const dropY = Math.min(
          this.screen.height - 1,
          Math.round(translate.y / (this.screen.char_height - 1))
        );
        this.dragInfo.element.setAttributeNS(
          null,
          "transform",
          this.grid_translate(dropX, dropY)
        );
        const index = this.dragInfo.element.getAttributeNS(null, "index");
        this.osd_set(index, "pos_x", dropX);
        this.osd_set(index, "pos_y", dropY);
        this.dragInfo.element = null;
      }
    },
    osd_set(i, attr, val) {
      const elements = this.is_hd
        ? this.profile.osd.elements_hd
        : this.profile.osd.elements;

      const copy: any[] = [...elements];
      copy[i] = this.osd_encode(elements[i], attr, val);

      if (this.is_hd) {
        this.profile.set_osd_elements_hd(copy);
      } else {
        this.profile.set_osd_elements(copy);
      }
    },
    osd_decode(element, attr) {
      switch (attr) {
        case "active":
          return element & 0x01;
        case "invert":
          return (element >> 1) & 0x01;
        case "pos_x":
          return (element >> 2) & 0xff;
        case "pos_y":
          return (element >> 10) & 0xff;
        default:
          return 0;
      }
    },
    osd_encode(element, attr, val) {
      switch (attr) {
        case "active":
          if (val) {
            return element | 0x01;
          } else {
            return element & ~0x01;
          }
        case "invert":
          if (val) {
            return element | (0x01 << 1);
          } else {
            return element & ~(0x01 << 1);
          }
        case "pos_x":
          return (element & ~(0xff << 2)) | ((val & 0xff) << 2);
        case "pos_y":
          return (element & ~(0xff << 10)) | ((val & 0xff) << 10);
        default:
          return element;
      }
    },
    draw_canvas_char(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      char: number,
      inverted: boolean
    ) {
      const charX = OSD.pixelsWidth(Math.floor(char % 16));
      const charY = OSD.pixelsHeight(Math.floor(char / 16));

      ctx.drawImage(
        inverted ? this.osd.font_bitmap_inverted : this.osd.font_bitmap,
        charX,
        charY,
        OSD.CHAR_WIDTH,
        OSD.CHAR_HEIGHT,
        x,
        y,
        OSD.CHAR_WIDTH,
        OSD.CHAR_HEIGHT
      );
    },
    draw_canvas() {
      const ctx = this.canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (const el of this.elements) {
        if (!el.enabled || !el.active) {
          continue;
        }

        const x = el.pos_x * OSD.CHAR_WIDTH;
        // simulate almost cut-off 0-th line
        const y = OSD.CHAR_HEIGHT - 2 + (el.pos_y - 1) * OSD.CHAR_HEIGHT;

        for (let i = 0; i < el.text.length; i++) {
          const element = el.text.charCodeAt(i);
          if (element == 0) {
            break;
          }
          this.draw_canvas_char(
            ctx,
            x + i * OSD.CHAR_WIDTH,
            y,
            element,
            el.invert == 1
          );
        }
      }
    },
  },
  mounted() {
    this.osd.fetch_osd_font().then((_) => this.draw_canvas());
  },
});
</script>

<style lang="scss" scoped>
svg {
  display: block;

  background-image: url("@/assets/osd_background.jpg");
  background-attachment: local;
  background-size: cover;

  font-family: monospace;
  font-size: 18px;
  border: 1px solid #3333334d;
  margin: auto;

  text {
    fill: #fff;
    user-select: none;
    pointer-events: none;
  }

  .text-invert {
    paint-order: stroke;
    fill: #000;
    stroke: #fff;
    stroke-width: 3px;
    stroke-linecap: butt;
    stroke-linejoin: miter;
  }

  .text-group {
    pointer-events: bounding-box;
    cursor: grab;
  }
}
.osd-canvas {
  background-image: url("@/assets/osd_background.jpg");
  background-attachment: local;
  background-size: cover;
}
</style>
