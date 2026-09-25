<script setup lang="ts">
import { RouterLink } from "vue-router";
import { ref, watch, nextTick } from "vue";
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
watch(
  () => props.active,
  async () => {
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
      class="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-3 border-b border-line bg-panel px-4 py-3"
    >
      <RouterLink to="/" class="text-ink" aria-label="QUICKSILVER home"
        ><Brand
      /></RouterLink>
      <div class="flex flex-wrap items-center gap-3 text-xs">
        <strong v-if="aircraft" class="font-medium">{{ aircraft }}</strong
        ><span v-if="target" class="border-l border-line pl-3 text-muted">{{
          target
        }}</span
        ><span class="flex items-center gap-2 text-muted"
          ><span
            class="size-2 rounded-full"
            :class="connected ? 'bg-accent' : 'bg-muted'"
          />{{ connection }}</span
        >
      </div>
      <div class="ml-auto text-xs text-muted"><slot name="connection" /></div>
    </header>
    <div class="flex min-h-0 flex-1 flex-col md:flex-row">
      <aside
        class="flex shrink-0 flex-col overflow-y-auto border-b border-line bg-panel md:w-44 md:border-r md:border-b-0"
      >
        <nav
          aria-label="Configuration"
          class="flex overflow-x-auto py-3 md:flex-col"
        >
          <RouterLink
            v-for="item in navigation"
            :key="item.id"
            :to="item.id"
            :aria-current="active === item.id ? 'page' : undefined"
            class="flex min-h-11 shrink-0 items-center gap-3 border-l-2 px-5 py-2 text-left text-sm"
            :class="[
              active === item.id
                ? 'border-accent bg-active font-medium text-accent'
                : 'border-transparent text-muted hover:bg-subtle hover:text-ink',
              item.id === '/templates'
                ? 'md:mt-5 md:border-t md:border-t-line md:pt-4'
                : '',
            ]"
          >
            <Icon :name="item.icon" />{{ item.label }}
          </RouterLink>
        </nav>
        <div
          class="flex items-center justify-between gap-4 px-3 pb-5 pt-4 md:mt-auto md:flex-col md:items-stretch"
        >
          <slot name="utilities" /><Appearance v-model="appearance" /><span
            class="text-xs text-muted"
            >v{{ version }}</span
          ><a
            href="https://docs.bosshobby.com"
            target="_blank"
            rel="noreferrer"
            class="text-xs text-muted hover:text-ink"
            >Help &amp; Docs</a
          >
        </div>
      </aside>
      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <main
          id="main-content"
          ref="content"
          class="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          tabindex="-1"
        >
          <div class="w-full p-4 lg:p-5"><slot /></div>
        </main>
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
