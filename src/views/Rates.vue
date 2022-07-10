<template>
  <div class="columns is-multiline">
    <div class="column is-12">
      <StickRatesLegacy v-if="has_legacy_stickrates" class="my-2"></StickRatesLegacy>
      <StickRates v-else class="my-2"></StickRates>
    </div>
    <div class="column is-12">
      <PIDRates class="my-2"></PIDRates>
    </div>
    <div class="column is-12">
      <FilterSettings class="my-2"></FilterSettings>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import StickRates from "@/panel/StickRates.vue";
import StickRatesLegacy from "@/panel/StickRatesLegacy.vue";
import PIDRates from "@/panel/PIDRates.vue";
import FilterSettings from "@/panel/FilterSettings.vue";
import { mapGetters } from "vuex";

export default defineComponent({
  name: "Rate",
  components: {
    StickRates,
    StickRatesLegacy,
    PIDRates,
    FilterSettings,
  },
  computed: {
    ...mapGetters(["has_legacy_stickrates"]),
  },
});
</script>

<style scoped></style>
