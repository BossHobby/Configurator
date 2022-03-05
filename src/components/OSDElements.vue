<template>
  <b-row>
    <b-col sm="6">
      <b-card>
        <h5 slot="header" class="mb-0">
          Elements
          <tooltip entry="osd.elements" />
        </h5>
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
    </b-col>
  </b-row>
</template>

<script>
import { mapFields } from "@/store/helper.js";

export default {
  name: "OSDElements",
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
        { name: "VTX CHANNEL", enabled: true, text: "R:7:1" },
        { name: "CURRENT", enabled: true, text: "2000A" },
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