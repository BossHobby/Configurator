<template>
  <b-container>
    <OSDElementsLegacy v-if="has_legacy_osd"></OSDElementsLegacy>
    <OSDElements v-else></OSDElements>
    <OSDFont v-if="!is_hd"></OSDFont>
  </b-container>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import OSDElementsLegacy from "@/components/OSDElementsLegacy.vue";
import OSDElements from "@/components/OSDElements.vue";
import OSDFont from "@/components/OSDFont.vue";

export default {
  name: "OSD",
  components: {
    OSDElementsLegacy,
    OSDElements,
    OSDFont,
  },
  computed: {
    ...mapGetters(["has_legacy_osd"]),
    ...mapState({
      is_hd: (state) => state.profile.serial.hdzero,
    }),
  },
  methods: {},
  created() {},
};
</script>
