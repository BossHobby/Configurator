<script setup lang="ts">
import { RouterLink } from "vue-router";
import { ref, watch, nextTick } from "vue";
import { EllipsisVertical, ChevronsLeft, ChevronsRight } from "@lucide/vue";
import Brand from "./Brand.vue";
import Icon, { type IconName } from "./Icon.vue";
import Appearance from "./Appearance.vue";
import { useAppearance } from "../../ui/useAppearance";
const props = defineProps<{
  active: string;
  navigation: { id: string; label: string; icon: IconName }[];
  aircraft: string;
  target: string;
  connection: string;
  connected?: boolean;
}>();

const version = import.meta.env.VITE_APP_VERSION;
const appearance = useAppearance();
const content = ref<HTMLElement>();
const menu = ref<HTMLDetailsElement>();

let initialCollapsed = false;
try {
  initialCollapsed = localStorage.getItem("sidebar-collapsed") === "true";
} catch {
  /* Storage may be unavailable. */
}
const collapsed = ref(initialCollapsed);
watch(collapsed, (value) => {
  try {
    localStorage.setItem("sidebar-collapsed", String(value));
  } catch {
    /* Sidebar still toggles without persistence. */
  }
});
watch(
  () => props.active,
  async () => {
    if (menu.value) menu.value.open = false;
    await nextTick();
    if (content.value) {
      content.value.scrollTop = 0;
      content.value.scrollLeft = 0;
    }
  },
);
</script>
<template>
  <div class="flex h-dvh flex-col overflow-hidden bg-workspace text-ink">
    <a href="#main-content" class="sr-only z-10 bg-panel p-3 focus:not-sr-only"
      >Skip to content</a
    >
    <header
      class="flex shrink-0 items-center gap-x-5 gap-y-3 border-b border-line bg-panel px-4 py-3"
    >
      <RouterLink to="/" class="shrink-0 text-ink" aria-label="QUICKSILVER home"
        ><Brand
      /></RouterLink>
      <div class="flex min-w-0 flex-wrap items-center gap-3 text-xs">
        <strong v-if="aircraft" class="truncate font-medium">{{
          aircraft
        }}</strong
        ><span
          v-if="target"
          class="hidden border-l border-line pl-3 text-muted sm:inline"
          >{{ target }}</span
        ><span class="flex items-center gap-2 text-muted"
          ><span
            class="size-2 rounded-full"
            :class="connected ? 'bg-accent' : 'bg-muted'"
          /><span class="hidden sm:inline">{{ connection }}</span></span
        >
      </div>
      <div class="ml-auto flex items-center gap-2 text-xs text-muted">
        <slot name="connection" />
        <details
          ref="menu"
          class="relative"
          :class="navigation.length && !collapsed ? 'md:hidden' : ''"
        >
          <summary
            class="flex size-9 cursor-pointer list-none items-center justify-center rounded-md hover:bg-subtle [&::-webkit-details-marker]:hidden"
            aria-label="More"
          >
            <EllipsisVertical :size="18" aria-hidden="true" />
          </summary>
          <div
            class="absolute right-0 z-20 mt-2 flex w-60 flex-col gap-3 rounded-lg border border-line bg-panel p-3 shadow-lg"
          >
            <slot name="utilities" /><Appearance v-model="appearance" />
            <div class="flex items-center justify-between">
              <span>v{{ version }}</span
              ><a
                href="https://docs.bosshobby.com"
                target="_blank"
                rel="noreferrer"
                class="hover:text-ink"
                >Help &amp; Docs</a
              >
            </div>
          </div>
        </details>
      </div>
    </header>
    <div class="flex min-h-0 flex-1 flex-col md:flex-row">
      <aside
        class="flex shrink-0 flex-col border-b border-line bg-panel md:overflow-y-auto md:border-r md:border-b-0"
        :class="[
          navigation.length ? '' : 'hidden',
          collapsed ? 'md:w-14' : 'md:w-48',
        ]"
      >
        <nav
          v-if="navigation.length"
          aria-label="Configuration"
          class="flex overflow-x-auto md:flex-col md:py-3"
        >
          <RouterLink
            v-for="item in navigation"
            :key="item.id"
            :to="item.id"
            :aria-current="active === item.id ? 'page' : undefined"
            :title="collapsed ? item.label : undefined"
            class="flex min-h-11 shrink-0 items-center gap-3 border-b-2 px-4 py-2 text-left text-sm md:border-b-0 md:border-l-2"
            :class="[
              collapsed ? 'md:justify-center md:px-0' : 'md:px-5',
              active === item.id
                ? 'border-accent bg-active font-medium text-ink'
                : 'border-transparent text-muted hover:bg-subtle hover:text-ink',
              item.id === '/templates'
                ? 'md:mt-5 md:border-t md:border-t-line md:pt-4'
                : '',
            ]"
          >
            <Icon
              :name="item.icon"
              :class="active === item.id ? 'text-accent' : ''"
            /><span :class="collapsed ? 'md:sr-only' : ''">{{
              item.label
            }}</span>
          </RouterLink>
        </nav>
        <div
          class="hidden flex-col gap-4 pt-4 pb-5 md:mt-auto md:flex md:items-stretch"
          :class="collapsed ? 'px-0' : 'px-3'"
        >
          <template v-if="!collapsed"
            ><slot name="utilities" /><Appearance v-model="appearance"
          /></template>
          <div
            class="flex items-center gap-3 text-xs text-muted"
            :class="collapsed ? 'justify-center' : ''"
          >
            <button
              type="button"
              class="-my-2 flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-subtle hover:text-ink"
              :class="collapsed ? '' : '-ml-2'"
              :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
              :aria-expanded="!collapsed"
              :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
              @click="collapsed = !collapsed"
            >
              <component
                :is="collapsed ? ChevronsRight : ChevronsLeft"
                :size="20"
                :stroke-width="1.75"
                aria-hidden="true"
              />
            </button>
            <template v-if="!collapsed"
              ><span>v{{ version }}</span
              ><a
                href="https://docs.bosshobby.com"
                target="_blank"
                rel="noreferrer"
                class="ml-auto hover:text-ink"
                >Help &amp; Docs</a
              ></template
            >
          </div>
        </div>
      </aside>
      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <main
          id="main-content"
          ref="content"
          class="relative min-h-0 flex-1 overflow-y-auto overscroll-contain"
          tabindex="-1"
        >
          <div class="mx-auto w-full max-w-[1600px] p-4 lg:p-6"><slot /></div>
        </main>
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
