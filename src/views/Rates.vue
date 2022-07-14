<template>
  <div class="columns is-multiline">
    <div class="column is-12">
      <StickRatesLegacy v-if="default_profile.has_legacy_stickrates"></StickRatesLegacy>
      <StickRates v-else></StickRates>
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
import StickRatesLegacy from "@/panel/StickRatesLegacy.vue";
import PIDRates from "@/panel/PIDRates.vue";
import FilterSettings from "@/panel/FilterSettings.vue";
import { useDefaultProfileStore } from "@/store/default_profile";

export default defineComponent({
  name: "Rate",
  components: {
    StickRates,
    PIDRates,
    FilterSettings,
    StickRatesLegacy,
  },
  setup() {
    return {
      default_profile: useDefaultProfileStore(),
    };
  },
});
</script>

<style scoped></style>
