<template>
  <div class="space-y-4">
    <ReceiverSettings v-if="info.quic_semver_gt('0.1.0')" />
    <ReceiverSettingsLegacy v-else />
    <RCChannels v-if="info.quic_semver_gt('0.1.0')" />
    <AuxChannels />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ReceiverSettings from "@/panel/ReceiverSettings.vue";
import ReceiverSettingsLegacy from "@/panel/ReceiverSettingsLegacy.vue";
import RCChannels from "@/panel/RCChannels.vue";
import AuxChannels from "@/panel/AuxChannels.vue";
import { useInfoStore } from "@/store/info";

export default defineComponent({
  name: "Receiver",
  components: {
    ReceiverSettings,
    ReceiverSettingsLegacy,
    RCChannels,
    AuxChannels,
  },
  setup() {
    return {
      info: useInfoStore(),
    };
  },
});
</script>

<style scoped></style>
