<template>
  <b-container>
    <b-row>
      <b-col sm="12" class="my-4">
        <ReceiverSettings></ReceiverSettings>
      </b-col>
      <b-col sm="12" class="my-4">
        <Channels></Channels>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import ReceiverSettings from "@/components/ReceiverSettings";
import Channels from "@/components/Channels";

export default {
  name: "Receiver",
  components: {
    ReceiverSettings,
    Channels,
  },
};
</script>

<style scoped>
</style>
