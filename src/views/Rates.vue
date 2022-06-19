<template>
  <b-container>
    <b-row>
      <b-col sm="12">
        <StickRatesLegacy
          v-if="has_legacy_stickrates"
          class="my-2"
        ></StickRatesLegacy>
        <StickRates v-else class="my-2"></StickRates>
      </b-col>
      <b-col sm="12">
        <PIDRates class="my-2"></PIDRates>
      </b-col>
      <b-col sm="12">
        <FilterSettings class="my-2"></FilterSettings>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import StickRates from "@/components/StickRates.vue";
import StickRatesLegacy from "@/components/StickRatesLegacy.vue";
import PIDRates from "@/components/PIDRates.vue";
import FilterSettings from "@/components/FilterSettings.vue";
import { mapGetters } from "vuex";

export default {
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
};
</script>

<style scoped></style>
