<script setup lang="ts">
import { RouterLink } from "vue-router";
import { ref, watch, nextTick } from "vue";
import { Menu as MenuIcon, X } from "@lucide/vue";
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
const menuOpen = ref(false);
const menuButton = ref<HTMLButtonElement>();
const drawer = ref<HTMLElement>();
function focusMenu() {
  drawer.value?.focus();
}
function closeMenu() {
  menuOpen.value = false;
  menuButton.value?.focus({ preventScroll: true });
}
// Connecting or disconnecting replaces the drawer's contents.
watch(
  () => props.navigation.length,
  () => (menuOpen.value = false),
);
watch(
  () => props.active,
  async () => {
    menuOpen.value = false;
    await nextTick();
    if (content.value) {
      content.value.scrollTop = 0;
      content.value.scrollLeft = 0;
    }
  },
);
</script>
<template>
  <div
    class="app-shell flex h-dvh flex-col overflow-hidden bg-workspace text-ink"
  >
    <a href="#main-content" class="sr-only z-10 bg-panel p-3 focus:not-sr-only"
      >Skip to content</a
    >
    <header
      class="app-shell-header flex shrink-0 items-center gap-x-5 gap-y-3 border-b border-line bg-panel px-4 py-3"
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
        <button
          ref="menuButton"
          type="button"
          class="flex size-9 items-center justify-center rounded-md hover:bg-subtle"
          :class="navigation.length ? 'md:hidden' : ''"
          aria-label="Menu"
          :aria-expanded="menuOpen"
          aria-controls="app-menu"
          @click="menuOpen = true"
        >
          <MenuIcon :size="20" aria-hidden="true" />
        </button>
      </div>
    </header>
    <div class="flex min-h-0 flex-1 flex-col md:flex-row">
      <aside
        class="app-shell-aside hidden shrink-0 flex-col border-line bg-panel md:w-48 md:overflow-y-auto md:border-r"
        :class="navigation.length ? 'md:flex' : ''"
      >
        <nav
          v-if="navigation.length"
          aria-label="Configuration"
          class="flex flex-col py-3"
        >
          <RouterLink
            v-for="item in navigation"
            :key="item.id"
            :to="item.id"
            :aria-current="active === item.id ? 'page' : undefined"
            class="flex min-h-11 shrink-0 items-center gap-3 border-l-2 px-5 py-2 text-left text-sm"
            :class="[
              active === item.id
                ? 'border-accent bg-active font-medium text-ink'
                : 'border-transparent text-muted hover:bg-subtle hover:text-ink',
              item.id === '/templates'
                ? 'mt-5 border-t border-t-line pt-4'
                : '',
            ]"
          >
            <Icon
              :name="item.icon"
              :class="active === item.id ? 'text-accent' : ''"
            />{{ item.label }}
          </RouterLink>
        </nav>
        <div class="mt-auto flex flex-col items-stretch gap-4 px-3 pt-4 pb-5">
          <slot name="utilities" /><Appearance v-model="appearance" />
          <div class="flex items-center justify-between text-xs text-muted">
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
      </aside>
      <div class="app-shell-bottom flex min-h-0 min-w-0 flex-1 flex-col">
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
    <Transition
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      enter-active-class="transition-opacity duration-200 motion-reduce:transition-none"
      leave-active-class="transition-opacity duration-200 motion-reduce:transition-none"
    >
      <div
        v-if="menuOpen"
        class="fixed inset-0 z-30 bg-black/40"
        aria-hidden="true"
        @click="closeMenu"
      />
    </Transition>
    <Transition
      enter-from-class="translate-x-full"
      leave-to-class="translate-x-full"
      enter-active-class="transition-transform duration-200 ease-out motion-reduce:transition-none"
      leave-active-class="transition-transform duration-150 ease-in motion-reduce:transition-none"
      @after-enter="focusMenu"
    >
      <div
        v-if="menuOpen"
        id="app-menu"
        ref="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        tabindex="-1"
        class="fixed inset-y-0 right-0 z-40 flex w-72 max-w-[85vw] flex-col border-l border-line bg-panel pt-[env(safe-area-inset-top,0px)] pr-[env(safe-area-inset-right,0px)] pb-[env(safe-area-inset-bottom,0px)] outline-none"
        @keydown.esc="closeMenu"
      >
        <div
          class="flex shrink-0 items-center justify-between border-b border-line px-4 py-3"
        >
          <span class="text-sm font-medium text-ink">Menu</span>
          <button
            type="button"
            class="flex size-9 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-ink"
            aria-label="Close menu"
            @click="closeMenu"
          >
            <X :size="18" aria-hidden="true" />
          </button>
        </div>
        <nav
          v-if="navigation.length"
          aria-label="Configuration"
          class="min-h-0 flex-1 overflow-y-auto overscroll-contain py-2"
        >
          <RouterLink
            v-for="item in navigation"
            :key="item.id"
            :to="item.id"
            :aria-current="active === item.id ? 'page' : undefined"
            class="flex min-h-12 items-center gap-3 border-l-2 px-5 py-2 text-sm"
            :class="[
              active === item.id
                ? 'border-accent bg-active font-medium text-ink'
                : 'border-transparent text-muted hover:bg-subtle hover:text-ink',
              item.id === '/templates'
                ? 'mt-3 border-t border-t-line pt-3'
                : '',
            ]"
            @click="menuOpen = false"
          >
            <Icon
              :name="item.icon"
              :class="active === item.id ? 'text-accent' : ''"
            />{{ item.label }}
          </RouterLink>
        </nav>
        <div
          class="mt-auto flex shrink-0 flex-col items-stretch gap-4 border-t border-line px-4 pt-4 pb-5 text-xs text-muted"
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
      </div>
    </Transition>
  </div>
</template>
