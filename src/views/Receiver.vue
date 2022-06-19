<template>
  <b-container>
    <b-row>
      <b-col sm="12" class="my-4">
        <ReceiverSettings></ReceiverSettings>
      </b-col>
      <b-col v-if="quicVersionGt('0.1.0')" sm="12" class="my-4">
        <RCChannels></RCChannels>
      </b-col>
      <b-col sm="12" class="my-4">
        <AuxChannels></AuxChannels>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import ReceiverSettings from "@/components/ReceiverSettings.vue";
import RCChannels from "@/components/RCChannels.vue";
import AuxChannels from "@/components/AuxChannels.vue";

import { mapGetters } from "vuex";

export default {
  name: "Receiver",
  components: {
    ReceiverSettings,
    RCChannels,
    AuxChannels,
  },
  computed: {
    ...mapGetters(["quicVersionGt"]),
  },
};
</script>

<style scoped></style>
