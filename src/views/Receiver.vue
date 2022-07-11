<template>
  <div class="columns is-multiline">
    <div class="column is-12">
      <ReceiverSettings></ReceiverSettings>
    </div>
    <div class="column is-12" v-if="quicVersionGt('0.1.0')">
      <RCChannels></RCChannels>
    </div>
    <div class="column is-12">
      <AuxChannels></AuxChannels>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ReceiverSettings from "@/panel/ReceiverSettings.vue";
import RCChannels from "@/panel/RCChannels.vue";
import AuxChannels from "@/panel/AuxChannels.vue";

import { mapGetters } from "vuex";

export default defineComponent({
  name: "Receiver",
  components: {
    ReceiverSettings,
    RCChannels,
    AuxChannels,
  },
  computed: {
    ...mapGetters(["quicVersionGt"]),
  },
});
</script>

<style scoped></style>
