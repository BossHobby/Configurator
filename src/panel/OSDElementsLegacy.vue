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
                    <input v-model="callsign" class="input" type="text" />
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
                  <svg :viewBox="viewBox" xmlns="http://www.w3.org/2000/svg">
                    <g v-for="(el, i) of elements" :key="i">
                      <g v-if="el.enabled && el.active">
                        <text
                          v-for="(c, ci) of el.text"
                          :key="'el-' + i + '-' + ci"
                          :class="{ 'text-invert': el.invert }"
                          :x="(el.pos_x + ci) * screen.char_width"
                          :y="el.pos_y * (screen.char_height - 1)"
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
import { useProfileStore } from "@/store/profile";

export default defineComponent({
  name: "OSDElementsLegacy",
  setup() {
    return {
      profile: useProfileStore(),
    };
  },
  data() {
    return {
      screen: {
        width: 30 - 2,
        height: 16 - 2,
        char_width: 12,
        char_height: 18,
      },
      imageSource: null,
    };
  },
  computed: {
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
        return this.profile.osd.elements
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
        const str = val.toUpperCase();
        const elements = Array(20)
          .fill(0x3f)
          .map((v, i) => {
            if (i < str.length) {
              return str.charCodeAt(i);
            }
            return v;
          })
          .reduce((prev, curr, i) => {
            const byte = Math.floor(i / 4);
            const shift = [0, 8, 16, 24][i % 4];
            prev[byte] = prev[byte] | ((curr & 0xff) << shift);
            return prev;
          }, []);

        const copy = [...this.profile.osd.elements];
        for (let i = 0; i < elements.length; i++) {
          copy[i + 1] = elements[i];
        }
        this.profile.osd.elements = copy;
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
        { name: "VTX CHANNEL", enabled: true, text: "R:7:1" },
        { name: "CURRENT", enabled: true, text: "2000A" },
      ];
    },
    elements() {
      return this.profile.osd.elements
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
    osd_set(i, attr, val) {
      const copy = [...this.profile.osd.elements];
      copy[i] = this.osd_encode(this.profile.osd.elements[i], attr, val);
      this.profile.set_osd_elements(copy);
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
          return (element & ~(0x1f << 2)) | ((val & 0x1f) << 2);
        case "pos_y":
          return (element & ~(0x0f << 7)) | ((val & 0x0f) << 7);
        default:
          return element;
      }
    },
  },
});
</script>

<style lang="scss" scoped>
svg {
  display: block;

  background-image: url("/osd_background.jpg");
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
