<template>
  <b-container>
    <b-row v-if="osd && osd.elements">
      <b-col sm="6">
        <b-card>
          <h5 slot="header" class="mb-0">Elements</h5>
          <b-row>
            <b-col sm="4">
              <label>Callsign Text</label>
            </b-col>
            <b-col sm="8">
              <b-form-input
                size="sm"
                type="text"
                v-model="callsign"
              ></b-form-input>
            </b-col>
          </b-row>
          <div v-for="(el, i) of elements" :key="i">
            <b-row v-if="el.enabled" class="my-3" align-v="center">
              <b-col sm="4">
                <label>{{ el.name }}</label>
              </b-col>
              <b-col sm="2">
                <b-form-checkbox
                  :checked="el.active == 1"
                  @input="osd_set(i, 'active', $event ? 1 : 0)"
                  name="check-button"
                  size="sm"
                  switch
                  >Active</b-form-checkbox
                >
              </b-col>
              <b-col sm="2">
                <b-form-checkbox
                  :checked="el.invert == 1"
                  @input="osd_set(i, 'invert', $event ? 1 : 0)"
                  name="check-button"
                  size="sm"
                  switch
                  >Invert</b-form-checkbox
                >
              </b-col>
              <b-col sm="2">
                <b-form-input
                  size="sm"
                  type="number"
                  step="1"
                  :value="el.pos_x"
                  @input="osd_set(i, 'pos_x', $event)"
                ></b-form-input>
              </b-col>
              <b-col sm="2">
                <b-form-input
                  size="sm"
                  type="number"
                  step="1"
                  :value="el.pos_y"
                  @input="osd_set(i, 'pos_y', $event)"
                ></b-form-input>
              </b-col>
            </b-row>
          </div>
        </b-card>
      </b-col>
      <b-col sm="6">
        <b-card>
          <h5 slot="header" class="mb-0">Preview</h5>
          <svg
            :width="svg_width"
            :height="svg_height"
            :viewBox="viewBox"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g v-for="(el, i) of elements" :key="i">
              <text
                v-if="el.enabled && el.active"
                :x="el.pos_x * screen.char_width"
                :y="el.pos_y * (screen.char_height - 1)"
                :class="{ 'text-invert': el.invert }"
              >
                {{ el.text }}
              </text>
            </g>
          </svg>
        </b-card>
        <b-card class="my-2">
          <h5 slot="header" class="mb-0">Font</h5>
          <b-row class="my-2">
            <b-col sm="2" class="my-2">
              <label for="font-file">File</label>
            </b-col>
            <b-col sm="6" class="my-2">
              <b-form-select
                id="font-file"
                v-model="current_font_file"
                :options="fontFiles"
              ></b-form-select>
            </b-col>
            <b-col sm="2" class="my-2">
              <spinner-btn v-on:click="apply_osd_font(current_font_file)">
                Upload
              </spinner-btn>
            </b-col>
          </b-row>
          <b-row>
            <b-img :src="imageSource" fluid-grow class="mx-5 mt-3"></b-img>
            <canvas
              ref="canvas"
              class="mx-5 mt-3 d-none"
              width="209"
              height="305"
            ></canvas>
          </b-row>
        </b-card>
      </b-col>
    </b-row>
    <div v-else>
      <h1>OSD not active</h1>
    </div>
  </b-container>
</template>

<script>
import { mapFields } from "@/store/helper.js";
import { serial } from "@/store/serial/serial";

export default {
  name: "osd",
  data() {
    return {
      screen: {
        width: 30 - 2,
        height: 16 - 2,
        char_width: 12,
        char_height: 18,
      },
      fontFiles: [{ text: "Clarity", value: "clarity" }],
      current_font_file: "clarity",
      imageSource: null,
    };
  },
  computed: {
    ...mapFields("profile", ["osd"]),
    svg_width() {
      return this.screen.width * this.screen.char_width;
    },
    svg_height() {
      return this.screen.height * this.screen.char_height;
    },
    viewBox() {
      return `0 0 ${this.svg_width} ${this.svg_height}`;
    },
    callsign: {
      get() {
        return this.osd.elements
          .slice(1, 5)
          .flatMap((e) => {
            return [0, 8, 16, 24].map((shift) => {
              const val = (e >> shift) & 0xff;
              if (val == 0x3f) {
                return "";
              }
              return String.fromCharCode(val);
            });
          })
          .join("");
      },
      set(val) {
        const elements = Array(20)
          .fill(0x3f)
          .map((v, i) => {
            if (i < val.length) {
              return val.charCodeAt(i);
            }
            return v;
          })
          .reduce((prev, curr, i) => {
            const byte = Math.floor(i / 4);
            const shift = [0, 8, 16, 24][i % 4];
            prev[byte] = prev[byte] | ((curr & 0xff) << shift);
            return prev;
          }, []);

        const copy = [...this.osd.elements];
        for (let i = 0; i < elements.length; i++) {
          copy[i + 1] = elements[i];
        }
        this.osd.elements = copy;
      },
    },
    element_options() {
      return [
        { name: "CALLSIGN", enabled: true, text: this.callsign },
        { name: "callsign2", enabled: false, text: "" },
        { name: "callsign3", enabled: false, text: "" },
        { name: "callsign4", enabled: false, text: "" },
        { name: "callsign5", enabled: false, text: "" },
        { name: "callsign6", enabled: false, text: "" },
        { name: "FUELGAUGE VOLTS", enabled: true, text: "1S 4.3V" },
        { name: "FILTERED VOLTS", enabled: true, text: "1S 4.3V" },
        { name: "GYRO TEMP", enabled: true, text: "40C" },
        { name: "FLIGHT MODE", enabled: true, text: "___ACRO___" },
        { name: "RSSI", enabled: true, text: "90" },
        { name: "STOPWATCH", enabled: true, text: "120" },
        { name: "SYSTEM STATUS", enabled: true, text: "__**ARMED**____" },
        { name: "THROTTLE", enabled: true, text: "50" },
        { name: "VTX CHANNEL", enabled: true, text: "" },
      ];
    },
    elements() {
      return this.osd.elements
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
  },
  methods: {
    apply_osd_font(name) {
      const loadImage = (url) => {
        return new Promise((r, e) => {
          let i = new Image();
          i.onload = () => r(i);
          i.onerror = (err) => e(err);
          i.src = url;
        });
      };
      return loadImage(name + ".png")
        .then((src) => {
          const canvas = this.$refs.canvas;
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(src, 0, 0);

          const width = 12;
          const height = 18;
          const border = 1;

          const full_width = 16 * (width + border) + border;
          //const full_height = 16 * (height + border) + border;

          const img = ctx.getImageData(0, 0, src.width, src.height);
          const font = [];
          for (let cy = 0; cy < 16; cy++) {
            for (let cx = 0; cx < 16; cx++) {
              const char = new Uint8Array((width * height) / 4);

              const getPixel = (x, y) => {
                const vx = x + cx * (width + border) + border;
                const vy = y + cy * (height + border) + border;

                let value = 0;

                const white = img.data[(vy * full_width + vx) * 4 + 0];
                if (white > 0) {
                  value |= 0x2;
                }

                const alpha = img.data[(vy * full_width + vx) * 4 + 3];
                if (alpha < 255) {
                  value |= 0x1;
                }

                return value;
              };

              let x = 0;
              let y = 0;
              for (let j = 0; j < 54; j++) {
                char[j] =
                  ((getPixel(x + 0, y) & 0x3) << 6) |
                  ((getPixel(x + 1, y) & 0x3) << 4) |
                  ((getPixel(x + 2, y) & 0x3) << 2) |
                  ((getPixel(x + 3, y) & 0x3) << 0);

                x += 4;
                if (x == width) {
                  x = 0;
                  y++;
                }
              }

              font.push(char);
            }
          }

          return serial.set_osd_font(font);
        })
        .then(() => this.get_osd_font())
        .then(() =>
          this.$store.commit("append_alert", {
            type: "success",
            msg: "Font updated!",
          })
        )
        .catch(() => {
          this.$store.commit("append_alert", {
            type: "danger",
            msg: "Font update failed!",
          });
        });
    },
    get_osd_font() {
      return serial.get_osd_font().then((font) => {
        const width = 12;
        const height = 18;
        const border = 1;

        const full_width = 16 * (width + border) + border;
        const full_height = 16 * (height + border) + border;

        const arr = new Uint8ClampedArray(width * height * 4);
        const setPixel = (x, y, v) => {
          switch (v) {
            case 0:
              arr[(y * width + x) * 4 + 0] = 0;
              arr[(y * width + x) * 4 + 1] = 0;
              arr[(y * width + x) * 4 + 2] = 0;
              arr[(y * width + x) * 4 + 3] = 255;
              break;
            case 2:
              arr[(y * width + x) * 4 + 0] = 255;
              arr[(y * width + x) * 4 + 1] = 255;
              arr[(y * width + x) * 4 + 2] = 255;
              arr[(y * width + x) * 4 + 3] = 255;
              break;
            default:
              arr[(y * width + x) * 4 + 0] = 0;
              arr[(y * width + x) * 4 + 1] = 0;
              arr[(y * width + x) * 4 + 2] = 0;
              arr[(y * width + x) * 4 + 3] = 0;
              break;
          }
        };

        const canvas = this.$refs.canvas;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "red";
        ctx.fillRect(0, 0, full_width, full_height);

        for (let cy = 0; cy < 16; cy++) {
          for (let cx = 0; cx < 16; cx++) {
            const buf = font[cy * 16 + cx];

            let x = 0;
            let y = 0;
            for (const b of buf) {
              setPixel(x + 0, y, (b >> 6) & 0x3);
              setPixel(x + 1, y, (b >> 4) & 0x3);
              setPixel(x + 2, y, (b >> 2) & 0x3);
              setPixel(x + 3, y, (b >> 0) & 0x3);

              x += 4;
              if (x == width) {
                x = 0;
                y++;
              }
            }

            const img = new ImageData(arr, width, height);
            ctx.putImageData(
              img,
              cx * (width + border) + border,
              cy * (height + border) + border
            );
          }
        }

        this.imageSource = canvas.toDataURL();
      });
    },
    osd_set(i, attr, val) {
      const copy = [...this.osd.elements];
      copy[i] = this.osd_encode(this.osd.elements[i], attr, val);
      this.$store.commit("set_osd_elements", copy);
    },
    osd_decode(element, attr) {
      switch (attr) {
        case "active":
          return element & 0x01;
        case "invert":
          return (element >> 1) & 0x01;
        case "pos_x":
          return (element >> 2) & 0x1f;
        case "pos_y":
          return (element >> 7) & 0x0f;
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
          return (element & ~(0x1f << 2)) | ((val & 0x1f) << 2);
        case "pos_y":
          return (element & ~(0x0f << 7)) | ((val & 0x0f) << 7);
      }
    },
  },
  created() {
    this.get_osd_font();
  },
};
</script>

<style lang="scss" scoped>
svg {
  display: block;

  background-image: url("~@/assets/osd_background.jpg");
  background-attachment: local;
  background-size: cover;

  font-family: monospace;
  font-size: 18px;
  border: 1px solid #3333334d;
  margin: auto;

  text {
    fill: #fff;
  }

  .text-invert {
    paint-order: stroke;
    fill: #000;
    stroke: #fff;
    stroke-width: 3px;
    stroke-linecap: butt;
    stroke-linejoin: miter;
  }
}
</style>