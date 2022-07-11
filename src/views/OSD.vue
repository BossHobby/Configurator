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
import { mapGetters, mapState } from "vuex";
import OSDElements from "@/panel/OSDElements.vue";
import OSDFont from "@/panel/OSDFont.vue";

export default defineComponent({
  name: "OSD",
  components: {
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
