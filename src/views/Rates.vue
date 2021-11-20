<template>
  <b-container>
    <b-row>
      <b-col sm="12">
        <StickRates class="my-2"></StickRates>
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
import StickRates from "@/components/StickRates";
import PIDRates from "@/components/PIDRates";
import FilterSettings from "@/components/FilterSettings";

export default {
  name: "Rate",
  components: {
    StickRates,
    PIDRates,
    FilterSettings
  }
};
</script>

<style scoped>
</style>
