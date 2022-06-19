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
        <svg :viewBox="viewBox" xmlns="http://www.w3.org/2000/svg">
          <g v-for="(el, i) of elements" :key="i">
            <g v-if="el.enabled && el.active">
              <text
                v-for="(c, ci) of el.text"
                :class="{ 'text-invert': el.invert }"
                :key="'el-' + i + '-' + ci"
                :x="(el.pos_x + ci) * screen.char_width"
                :y="el.pos_y * (screen.char_height - 1)"
              >
                {{ c }}
              </text>
            </g>
          </g>
        </svg>
      </b-card>
    </b-col>
  </b-row>
</template>

<script>
import { mapState } from "vuex";
import { mapFields } from "@/store/helper.js";

export default {
  name: "OSDElements",
  data() {
    return {};
  },
  computed: {
    ...mapFields("profile", ["osd"]),
    ...mapState({
      is_hd: (state) => state.profile.serial.hdzero,
    }),
    currentElements() {
      return this.is_hd ? this.osd.elements_hd : this.osd.elements;
    },
    screen() {
      return {
        width: this.is_hd ? 50 : 30,
        height: this.is_hd ? 18 : 16 - 2,
        char_width: 12,
        char_height: 18,
      };
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
        { name: "CALLSIGN", enabled: true, text: this.osd.callsign },
        { name: "CELL COUNT", enabled: true, text: "1S" },
        { name: "FUELGAUGE VOLTS", enabled: true, text: " 4.3V" },
        { name: "FILTERED VOLTS", enabled: true, text: " 4.3V" },
        { name: "GYRO TEMP", enabled: true, text: "  40C" },
        { name: "FLIGHT MODE", enabled: true, text: "___ACRO___" },
        { name: "RSSI", enabled: true, text: "   90" },
        { name: "STOPWATCH", enabled: true, text: "01:20" },
        { name: "SYSTEM STATUS", enabled: true, text: "__**ARMED**____" },
        { name: "THROTTLE", enabled: true, text: "  50%" },
        { name: "VTX CHANNEL", enabled: true, text: "R:7:1" },
        { name: "CURRENT", enabled: true, text: "0.00A" },
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
        this.osd.callsign = str;
      },
      get() {
        return this.osd.callsign.replace(/\0/g, "");
      },
    },
  },
  methods: {
    osd_set(i, attr, val) {
      const elements = this.is_hd ? this.osd.elements_hd : this.osd.elements;
      const copy = [...elements];
      copy[i] = this.osd_encode(elements[i], attr, val);
      this.$store.commit(
        this.is_hd ? "set_osd_elements_hd" : "set_osd_elements",
        copy
      );
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
      }
    },
  },
};
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
