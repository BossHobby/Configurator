<script setup lang="ts">
import {
  CircleHelp,
  SlidersHorizontal,
  Radio,
  Settings2,
  Scan,
  HardDrive,
  Activity,
  Folder,
  Wrench,
  FileStack,
  Check,
  AlertTriangle,
  ChevronDown,
  LoaderCircle,
} from "@lucide/vue";
const icons = {
  profile: Folder,
  setup: Wrench,
  receiver: Radio,
  outputs: Settings2,
  control: SlidersHorizontal,
  osd: Scan,
  blackbox: HardDrive,
  diagnostics: Activity,
  templates: FileStack,
  check: Check,
  warning: AlertTriangle,
  chevron: ChevronDown,
  loading: LoaderCircle,
  help: CircleHelp,
};
export type IconName = keyof typeof icons;
defineProps<{ name: IconName }>();
const navigationPaths: Partial<Record<IconName, string[]>> = {
  profile: ["M7 3h10l3 3v12l-3 3H7l-3-3V6z", "m9 8 6 8m0-8-6 8M9 12h6"],
  receiver: [
    "M5 7h14a2 2 0 0 1 2 2v10H3V9a2 2 0 0 1 2-2Z",
    "M8 3h8M12 3v4M7 11h2m6 0h2M7 15h2m6 0h2",
  ],
  outputs: [
    "M5 3v5m0 7v6M12 3v10m0 6v2M19 3v2m0 7v9",
    "M3 8h4v7H3zM10 13h4v6h-4zM17 5h4v7h-4z",
  ],
  control: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z", "M12 3v18M3 12h18"],
  osd: ["M3 5h18v14H3z", "M6 9h2m2 0h2m4 0h2M6 13h2m2 0h2m4 2h2"],
  blackbox: ["M4 3h16v18H4z", "M7 7h2m2 0h6M7 11h2m2 0h6M7 15h2m2 0h6"],
  diagnostics: [
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z",
    "M12 3v9h9M3 12h4m5 5v4",
  ],
  templates: ["M8 5H5v16h14V5h-3M8 3h8v4H8z", "M8 11h8M8 15h8"],
};
</script>
<template>
  <svg
    v-if="navigationPaths[name]"
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="shrink-0"
  >
    <path v-for="path in navigationPaths[name]" :key="path" :d="path" />
  </svg>
  <component
    :is="icons[name]"
    v-else
    :size="18"
    :stroke-width="1.75"
    aria-hidden="true"
    class="shrink-0"
  />
</template>
