<template>
  <b-container>
    <b-row v-if="osd && osd.elements">
      <b-col sm="6">
        <b-card>
          <h5 slot="header" class="mb-0">Elements</h5>
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
                >Active</b-form-checkbox>
              </b-col>
              <b-col sm="2">
                <b-form-checkbox
                  :checked="el.invert == 1"
                  @input="osd_set(i, 'invert', $event ? 1 : 0)"
                  name="check-button"
                  size="sm"
                  switch
                >Invert</b-form-checkbox>
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
                :x="el.pos_x * (screen.char_width)"
                :y="el.pos_y * (screen.char_height - 1)"
                :class="{'text-invert': el.invert}"
              >{{el.text}}</text>
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
              <b-form-select id="font-file" v-model="current_font_file" :options="fontFiles"></b-form-select>
            </b-col>
            <b-col sm="2" class="my-2">
              <b-button v-on:click="apply_osd_font(current_font_file)">Upload</b-button>
            </b-col>
          </b-row>
          <b-row>
            <b-img :src="imageSource" fluid-grow class="mx-5 mt-3"></b-img>
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
import { mapActions } from "vuex";
import { mapFields } from "@/store/helper.js";

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
      element_options: [
        { name: "CALLSIGN", enabled: true, text: "QUICKSILVER" },
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
      ],
      fontFiles: [{ text: "Clarity", value: "clarity" }],
      current_font_file: "clarity",
      imageSource: "http://localhost:8000/api/osd/font",
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
    ...mapActions(["set_osd_font"]),
    apply_osd_font(name) {
      const oldSrc = this.imageSource;
      this.imageSource = "";
      return this.set_osd_font(name).then(() => (this.imageSource = oldSrc));
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