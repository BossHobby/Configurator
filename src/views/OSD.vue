<template>
  <div class="columns is-multiline">
    <div class="column is-12">
      <OSDElements></OSDElements>
    </div>
    <div class="column is-12">
      <OSDFont v-if="!is_hd"></OSDFont>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import OSDElements from "@/panel/OSDElements.vue";
import OSDFont from "@/panel/OSDFont.vue";
import { useProfileStore } from "@/store/profile";

export default defineComponent({
  name: "OSD",
  components: {
    OSDElements,
    OSDFont,
  },
  setup() {
    return {
      profile: useProfileStore(),
    };
  },
  computed: {
    is_hd() {
      return this.profile.serial.hdzero;
    },
  },
});
</script>
