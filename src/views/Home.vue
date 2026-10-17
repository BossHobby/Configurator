<template>
  <div class="mx-auto max-w-4xl">
    <Info>
      <div v-if="picking" class="flex justify-center"><BleDevices /></div>
      <Flash v-else-if="flashSupported" />
    </Info>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Info from "@/panel/Info.vue";
import Flash from "@/panel/Flash.vue";
import BleDevices from "@/components/BleDevices.vue";
import { bleScan } from "@/store/serial/ble-scan";
import { useSerialStore } from "@/store/serial";
import { usbSupported } from "@/store/connection";

export default defineComponent({
  name: "Home",
  components: {
    Info,
    Flash,
    BleDevices,
  },
  setup: () => ({
    serial: useSerialStore(),
    // Flashing needs WebUSB, which the native apps lack.
    flashSupported: usbSupported(),
  }),
  computed: {
    // The native apps list nearby modules in the page while scanning.
    picking() {
      return (
        bleScan.scanning || (this.serial.is_connecting && !!bleScan.selected)
      );
    },
  },
});
</script>
