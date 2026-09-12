<template>
  <div class="columns is-multiline">
    <div v-if="!info.is_rover" class="column is-12">
      <StickRatesLegacy
        v-if="default_profile.has_legacy_stickrates"
      ></StickRatesLegacy>
      <StickRates v-else></StickRates>
    </div>
    <div class="column is-12">
      <ThrottleSettings></ThrottleSettings>
    </div>
    <div class="column is-12">
      <PIDRates></PIDRates>
    </div>
    <div class="column is-12">
      <FilterSettings></FilterSettings>
    </div>
    <div
      v-if="profile.profileVersionGt('0.3.0') && profile.serial.gps !== 0"
      class="column is-12"
    >
      <Navigation></Navigation>
    </div>
    <div v-if="info.is_rover" class="column is-12">
      <RoverSettings></RoverSettings>
    </div>
    <div v-if="info.is_wing" class="column is-12">
      <WingSettings></WingSettings>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import FilterSettings from "@/panel/FilterSettings.vue";
import Navigation from "@/panel/Navigation.vue";
import PIDRates from "@/panel/PIDRates.vue";
import RoverSettings from "@/panel/RoverSettings.vue";
import StickRates from "@/panel/StickRates.vue";
import StickRatesLegacy from "@/panel/StickRatesLegacy.vue";
import ThrottleSettings from "@/panel/ThrottleSettings.vue";
import WingSettings from "@/panel/WingSettings.vue";
import { useDefaultProfileStore } from "@/store/default_profile";
import { useInfoStore } from "@/store/info";
import { useProfileStore } from "@/store/profile";

export default defineComponent({
  name: "Control",
  components: {
    FilterSettings,
    Navigation,
    PIDRates,
    RoverSettings,
    StickRates,
    StickRatesLegacy,
    ThrottleSettings,
    WingSettings,
  },
  setup() {
    return {
      default_profile: useDefaultProfileStore(),
      info: useInfoStore(),
      profile: useProfileStore(),
    };
  },
});
</script>
