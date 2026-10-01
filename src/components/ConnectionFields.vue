<script setup lang="ts">
import { ref, watch } from "vue";
import { Capacitor } from "@capacitor/core";
import { useSerialStore } from "@/store/serial";
import { bleSupported } from "@/store/serial/ble";
import { usbSupported } from "@/store/serial/connection";
const serial = useSerialStore();
// The native apps only talk to CRSF bridges with fixed Bluetooth settings.
const native = Capacitor.isNativePlatform();

const wifiPresets = [{ name: "Crossfire", url: "ws://192.168.4.1/ws" }];
// The selected preset's URL, or "" for a manually entered address. Kept
// separate from the URL so choosing Manual does not snap back to a preset
// while the address still matches one.
const preset = ref(
  serial.connection.url
    ? (wifiPresets.find((p) => p.url === serial.connection.url)?.url ?? "")
    : wifiPresets[0].url,
);
watch(
  [preset, () => serial.connection.kind],
  ([url, kind]) => {
    if (kind === "crsf" && url) serial.connection.url = url;
  },
  { immediate: true },
);
</script>

<template>
  <fieldset :disabled="serial.is_connecting" class="space-y-4">
    <label class="block text-sm">
      Connect using
      <select v-model="serial.connection.kind" class="form-input mt-1">
        <template v-if="native">
          <option value="ble-crsf">Bluetooth</option>
          <option value="crsf">Wi-Fi</option>
        </template>
        <template v-else>
          <option v-if="usbSupported()" value="usb">USB</option>
          <option v-if="bleSupported()" value="ble">Bluetooth · QUIC</option>
          <option v-if="bleSupported()" value="ble-crsf">
            Bluetooth · CRSF
          </option>
          <option value="websocket">Wi-Fi · QUIC</option>
          <option value="crsf">Wi-Fi · CRSF</option>
        </template>
      </select>
    </label>
    <label v-if="serial.connection.kind === 'crsf'" class="block text-sm">
      Wi-Fi module
      <select v-model="preset" class="form-input mt-1">
        <option v-for="p in wifiPresets" :key="p.url" :value="p.url">
          {{ p.name }}
        </option>
        <option value="">Manual</option>
      </select>
    </label>
    <label
      v-if="
        serial.connection.kind === 'websocket' ||
        (serial.connection.kind === 'crsf' && !preset)
      "
      class="block text-sm"
    >
      WebSocket address
      <input
        v-model.trim="serial.connection.url"
        type="url"
        placeholder="ws://192.168.4.1/ws"
        class="form-input mt-1"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
      />
    </label>
    <template
      v-if="!native && ['ble', 'ble-crsf'].includes(serial.connection.kind)"
    >
      <p class="text-sm text-muted">
        Connect opens the Bluetooth device picker. Choose the protocol supported
        by your bridge.
      </p>
      <details class="text-sm">
        <summary class="cursor-pointer py-2">
          Bluetooth service settings
        </summary>
        <p class="my-2 text-muted">
          Defaults use Nordic UART. The bridge must carry
          {{
            serial.connection.kind === "ble-crsf" ? "CRSF frames" : "QUIC bytes"
          }}
          and support acknowledged writes.
        </p>
        <label class="mb-3 block"
          >Service UUID<input
            v-model.trim="serial.connection.ble.service"
            class="form-input mt-1 font-mono text-xs"
            autocapitalize="off"
            spellcheck="false"
        /></label>
        <label class="mb-3 block"
          >Write characteristic UUID<input
            v-model.trim="serial.connection.ble.writeCharacteristic"
            class="form-input mt-1 font-mono text-xs"
            autocapitalize="off"
            spellcheck="false"
        /></label>
        <label class="block"
          >Notify characteristic UUID<input
            v-model.trim="serial.connection.ble.notifyCharacteristic"
            class="form-input mt-1 font-mono text-xs"
            autocapitalize="off"
            spellcheck="false"
        /></label>
      </details>
    </template>
  </fieldset>
</template>
