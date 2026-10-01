<template>
  <section
    class="flex flex-col items-center gap-5 rounded-lg border border-line bg-panel px-6 pt-10 pb-6 text-center"
  >
    <LogoClean class="size-20" aria-hidden="true" />
    <div>
      <h1 class="text-2xl font-semibold text-ink">QUICKSILVER Configurator</h1>
      <p class="mx-auto mt-2 max-w-md text-sm text-muted">
        Connect your flight controller over
        {{ native ? "Bluetooth or Wi-Fi" : "USB, Bluetooth, or Wi-Fi" }} to
        configure your craft, check receiver inputs, and tune its response.
      </p>
    </div>
    <slot name="connection" />
    <div class="flex flex-wrap items-center justify-center gap-3">
      <UiButton
        v-if="!hideConnect"
        variant="primary"
        class="min-h-11 px-6 text-base"
        :busy="serial.is_connecting"
        @click="connect"
        >Connect flight controller</UiButton
      >
      <spinner-btn v-if="updateAvailable" @click="doUpdate"
        >Install update</spinner-btn
      >
    </div>
    <ConnectProgress v-if="serial.is_connecting && !bleScan.scanning" />
    <p class="text-xs text-muted">
      v{{ appVersion }} ·
      <a
        href="https://docs.bosshobby.com/"
        target="_blank"
        rel="noreferrer"
        class="font-medium text-accent hover:underline"
        >Getting started ↗</a
      >
    </p>
    <div v-if="$slots.default" class="w-full text-left"><slot /></div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Capacitor } from "@capacitor/core";
import { updater } from "@/store/util/updater";
import { useRootStore } from "@/store/root";
import { useSerialStore } from "@/store/serial";
import UiButton from "@/components/ui/Button.vue";
import LogoClean from "@/assets/Logo_Clean.svg?component";
import ConnectProgress from "@/components/ConnectProgress.vue";
import { bleScan } from "@/store/serial/ble-scan";

export default defineComponent({
  name: "Info",
  components: { UiButton, LogoClean, ConnectProgress },
  // Panels placed in the slot (the firmware flasher) render as divided
  // sub-sections of this card instead of a second card.
  provide: { "ui-panel": true },
  props: {
    // Set while the connection slot shows its own controls (BLE device list).
    hideConnect: { type: Boolean, default: false },
  },
  setup() {
    return { serial: useSerialStore(), root: useRootStore(), bleScan };
  },
  data() {
    return {
      updateAvailable: null,
      appVersion: import.meta.env.VITE_APP_VERSION,
      native: Capacitor.isNativePlatform(),
    };
  },
  created() {
    if (!updater.updatePending()) {
      updater.checkForUpdate(
        this.appVersion,
        (updateAvailable) => (this.updateAvailable = updateAvailable),
      );
    }
  },
  methods: {
    async connect() {
      try {
        await this.serial.toggle_connection();
      } catch (error) {
        this.root.append_alert({ type: "danger", msg: String(error) });
      }
    },
    doUpdate() {
      return updater.update(this.updateAvailable);
    },
  },
});
</script>
