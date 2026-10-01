<script setup lang="ts">
import { watch } from "vue";
import Icon from "@/components/ui/Icon.vue";
import UiButton from "@/components/ui/Button.vue";
import { useSerialStore } from "@/store/serial";
import { bleScan, cancelScan, chooseDevice } from "@/store/serial/ble-scan";

const serial = useSerialStore();
watch(
  () => serial.is_connecting,
  (connecting) => {
    if (!connecting) bleScan.selected = undefined;
  },
);

/** 1–4 bars from RSSI, matching common phone signal indicators. */
function bars(rssi?: number) {
  if (rssi === undefined) return 0;
  if (rssi >= -60) return 4;
  if (rssi >= -70) return 3;
  if (rssi >= -80) return 2;
  return 1;
}
</script>

<template>
  <div class="w-full max-w-sm text-left">
    <div
      class="overflow-hidden rounded-lg border border-line bg-workspace"
      aria-live="polite"
    >
      <div
        class="flex items-center justify-between border-b border-line px-4 py-3 text-sm"
      >
        <span class="font-medium text-ink">Nearby devices</span>
        <span
          v-if="bleScan.scanning"
          class="flex items-center gap-2 text-xs text-muted"
          ><Icon name="loading" class="motion-safe:animate-spin" />
          Scanning</span
        >
      </div>
      <ul v-if="bleScan.devices.length" class="divide-y divide-line">
        <li v-for="device in bleScan.devices" :key="device.deviceId">
          <button
            type="button"
            class="flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left hover:bg-subtle disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent"
            :disabled="!!bleScan.selected"
            :aria-busy="bleScan.selected === device.deviceId || undefined"
            @click="chooseDevice(device.deviceId)"
          >
            <span class="min-w-0 flex-1 truncate font-medium text-ink">{{
              device.name
            }}</span>
            <Icon
              v-if="bleScan.selected === device.deviceId"
              name="loading"
              class="text-accent motion-safe:animate-spin"
              aria-label="Connecting"
            />
            <span
              v-else
              class="flex h-4 items-end gap-0.5"
              :aria-label="`Signal ${bars(device.rssi)} of 4`"
              role="img"
            >
              <span
                v-for="bar in 4"
                :key="bar"
                class="w-1 rounded-sm"
                :class="bar <= bars(device.rssi) ? 'bg-accent' : 'bg-line'"
                :style="{ height: `${bar * 25}%` }"
              />
            </span>
          </button>
        </li>
      </ul>
      <p v-else class="px-4 py-6 text-center text-sm text-muted">
        Power on your module and keep it close to this phone.
      </p>
    </div>
    <div class="mt-3 flex justify-center">
      <UiButton v-if="bleScan.scanning" @click="cancelScan">Cancel</UiButton>
    </div>
  </div>
</template>
