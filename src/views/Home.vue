<template>
  <div class="mx-auto max-w-4xl">
    <ConnectionPanel v-if="!native" />
    <Info :hide-connect="picking">
      <template v-if="native" #connection>
        <BleDevices v-if="picking" />
        <ConnectionFields v-else class="w-full max-w-xs text-left" />
      </template>
      <Flash v-if="usbFlashSupported()" />
      <p v-else-if="!native" class="text-sm text-muted">
        USB firmware flashing is available in the desktop app or a compatible
        browser.
      </p></Info
    >
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Capacitor } from "@capacitor/core";
import Info from "@/panel/Info.vue";
import Flash from "@/panel/Flash.vue";
import ConnectionPanel from "@/panel/Connection.vue";
import ConnectionFields from "@/components/ConnectionFields.vue";
import BleDevices from "@/components/BleDevices.vue";
import { bleScan } from "@/store/serial/ble-scan";
import { useSerialStore } from "@/store/serial";
import { usbFlashSupported } from "@/store/serial/connection";

export default defineComponent({
  name: "Home",
  components: {
    Info,
    ConnectionPanel,
    ConnectionFields,
    BleDevices,
    Flash,
  },
  setup: () => ({
    usbFlashSupported,
    native: Capacitor.isNativePlatform(),
    serial: useSerialStore(),
  }),
  computed: {
    picking() {
      return (
        bleScan.scanning || (this.serial.is_connecting && !!bleScan.selected)
      );
    },
  },
});
</script>
