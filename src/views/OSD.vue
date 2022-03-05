<template>
  <b-container>
    <OSDElements></OSDElements>
    <OSDFont></OSDFont>
  </b-container>
</template>

<script>
import { mapFields } from "@/store/helper.js";

import OSDElements from "@/components/OSDElements";
import OSDFont from "@/components/OSDFont";

export default {
  name: "OSD",
  components: {
    OSDElements,
    OSDFont,
  },
  computed: {
    ...mapFields("profile", ["osd"]),
  },
  methods: {},
  created() {},
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