<template>
  <Teleport v-if="!info.is_rover" defer to="#page-actions">
    <UiSelect
      v-if="!default_profile.has_legacy_stickrates"
      v-model="profile.rate.profile"
      class="w-40"
      label="Rate profile"
      help="rate.profile"
      :options="[
        { value: 0, label: 'Rate Profile 1' },
        { value: 1, label: 'Rate Profile 2' },
      ]"
    />
    <UiSelect
      v-model="profile.pid.pid_profile"
      class="w-40"
      label="PID profile"
      help="pid.profile"
      :options="[
        { value: 0, label: 'PID Profile 1' },
        { value: 1, label: 'PID Profile 2' },
      ]"
    />
  </Teleport>
  <div class="space-y-5">
    <div v-if="!info.is_rover">
      <StickRatesLegacy
        v-if="default_profile.has_legacy_stickrates"
      ></StickRatesLegacy>
      <StickRates v-else></StickRates>
    </div>
    <div>
      <ThrottleSettings></ThrottleSettings>
    </div>
    <div>
      <PIDRates></PIDRates>
    </div>
    <div>
      <FilterSettings></FilterSettings>
    </div>
    <div
      v-if="
        info.is_multi &&
        profile.profileVersionGt('0.3.0') &&
        profile.serial.gps !== 0
      "
    >
      <Navigation></Navigation>
    </div>
    <div v-if="info.is_rover">
      <RoverSettings></RoverSettings>
    </div>
    <div v-if="info.is_wing">
      <WingSettings></WingSettings>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import UiSelect from "@/components/ui/Select.vue";
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
    UiSelect,
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
