<script setup lang="ts">
import { useSerialStore } from "@/store/serial";
const serial = useSerialStore();
</script>

<template>
  <div class="w-full max-w-xs" aria-live="polite">
    <div
      role="progressbar"
      aria-label="Connection progress"
      :aria-valuenow="Math.round(serial.connect_progress * 100)"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuetext="serial.connect_status"
      class="h-1.5 overflow-hidden rounded-full bg-subtle"
    >
      <div
        class="h-full rounded-full bg-accent transition-[width] duration-500 ease-out motion-reduce:transition-none"
        :style="{ width: `${serial.connect_progress * 100}%` }"
      />
    </div>
    <p class="mt-2 text-xs text-muted">{{ serial.connect_status }}</p>
  </div>
</template>
