<template>
  <b-container>
    <b-row>
      <b-col sm="12" class="my-4">
        <ReceiverSettings></ReceiverSettings>
      </b-col>
      <b-col sm="12" class="my-4">
        <RCChannels></RCChannels>
      </b-col>
      <b-col sm="12" class="my-4">
        <AuxChannels></AuxChannels>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import ReceiverSettings from "@/components/ReceiverSettings";
import RCChannels from "@/components/RCChannels";
import AuxChannels from "@/components/AuxChannels";

export default {
  name: "Receiver",
  components: {
    ReceiverSettings,
    RCChannels,
    AuxChannels,
  },
};
</script>

<style scoped></style>
