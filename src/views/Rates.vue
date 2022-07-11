<template>
  <div class="columns is-multiline">
    <div class="column is-12">
      <StickRates></StickRates>
    </div>
    <div class="column is-12">
      <PIDRates></PIDRates>
    </div>
    <div class="column is-12">
      <FilterSettings></FilterSettings>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import StickRates from "@/panel/StickRates.vue";
import PIDRates from "@/panel/PIDRates.vue";
import FilterSettings from "@/panel/FilterSettings.vue";
import { mapGetters } from "vuex";

export default defineComponent({
  name: "Rate",
  components: {
    StickRates,
    PIDRates,
    FilterSettings,
  },
  computed: {
    ...mapGetters(["has_legacy_stickrates"]),
  },
});
</script>

<style scoped></style>
