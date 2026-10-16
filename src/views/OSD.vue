<template>
  <div class="space-y-4">
    <div>
      <OSDElementsLegacy
        v-if="default_profile.has_legacy_osd"
      ></OSDElementsLegacy>
      <OSDElements v-else></OSDElements>
    </div>
    <div v-if="!is_hd && !serial.radio_link">
      <OSDFont></OSDFont>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import OSDElements from "@/panel/OSDElements.vue";
import OSDElementsLegacy from "@/panel/OSDElementsLegacy.vue";
import OSDFont from "@/panel/OSDFont.vue";
import { useProfileStore } from "@/store/profile";
import { useDefaultProfileStore } from "@/store/default_profile";
import { useSerialStore } from "@/store/serial";
import { useOSDStore } from "@/store/osd";

export default defineComponent({
  name: "OSD",
  components: {
    OSDElements,
    OSDElementsLegacy,
    OSDFont,
  },
  setup() {
    return {
      profile: useProfileStore(),
      default_profile: useDefaultProfileStore(),
      serial: useSerialStore(),
      osd: useOSDStore(),
    };
  },
  computed: {
    is_hd() {
      return this.profile.serial.hdzero;
    },
  },
  watch: {
    is_hd: {
      immediate: true,
      handler(is_hd: boolean) {
        // The board's font cannot be read over the radio link, so the
        // analog preview uses the bundled default.
        if (!is_hd && this.serial.radio_link)
          this.osd.load_sd_osd_font("clarity.png");
      },
    },
  },
});
</script>
