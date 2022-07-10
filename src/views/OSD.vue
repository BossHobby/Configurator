<template>
  <OSDElementsLegacy v-if="has_legacy_osd"></OSDElementsLegacy>
  <OSDElements v-else></OSDElements>
  <OSDFont v-if="!is_hd"></OSDFont>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapGetters, mapState } from "vuex";
import OSDElementsLegacy from "@/panel/OSDElementsLegacy.vue";
import OSDElements from "@/panel/OSDElements.vue";
import OSDFont from "@/panel/OSDFont.vue";

export default defineComponent({
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
});
</script>
