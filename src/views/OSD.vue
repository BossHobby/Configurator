<template>
  <div class="columns is-multiline">
    <div class="column is-12">
      <OSDElementsLegacy v-if="default_profile.has_legacy_osd"></OSDElementsLegacy>
      <OSDElements v-else></OSDElements>
    </div>
    <div class="column is-12">
      <OSDFont v-if="!is_hd"></OSDFont>
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
    };
  },
  computed: {
    is_hd() {
      return this.profile.serial.hdzero;
    },
  },
});
</script>
