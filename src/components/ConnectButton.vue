<template>
  <div ref="root" class="relative flex" @keydown.esc="closeMenu(true)">
    <span
      v-if="connected"
      class="flex min-h-9 items-center px-2 text-muted"
      :title="describe(connection.selected)"
    >
      <Icon :name="iconFor(connection.selected)" />
      <span class="sr-only">via {{ connection.selected.name }}</span>
    </span>
    <button
      v-else
      ref="toggle"
      type="button"
      class="form-button rounded-r-none border-r-0 px-2"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-label="'Connection: ' + connection.selected.name"
      :title="describe(connection.selected)"
      :disabled="busy || disabled"
      @click="open = !open"
    >
      <Icon :name="iconFor(connection.selected)" /><Icon
        name="chevron"
        class="-ml-1 text-muted"
      />
    </button>
    <UiButton
      :busy="busy"
      :disabled="disabled"
      :class="connected ? '' : 'rounded-l-none'"
      @click="$emit('toggle')"
      >{{ connected ? "Disconnect" : "Connect" }}</UiButton
    >
    <div
      v-if="open"
      role="menu"
      aria-label="Connection"
      class="absolute top-full right-0 z-20 mt-2 flex w-72 max-w-[calc(100vw-2rem)] flex-col rounded-lg border border-line bg-panel p-1 text-sm text-ink shadow-lg"
    >
      <div
        v-for="option in connection.options"
        :key="option.id"
        class="group flex items-center rounded-md hover:bg-subtle"
      >
        <button
          type="button"
          role="menuitemradio"
          :aria-checked="option.id === connection.selected.id"
          class="flex min-h-10 min-w-0 flex-1 items-center gap-3 px-3 py-1.5 text-left"
          @click="select(option.id)"
        >
          <Icon
            :name="iconFor(option)"
            :class="
              option.id === connection.selected.id
                ? 'text-accent'
                : 'text-muted'
            "
          />
          <span class="flex min-w-0 flex-col">
            <span
              class="truncate"
              :class="option.id === connection.selected.id ? 'font-medium' : ''"
              >{{ option.name }}</span
            >
            <span
              v-if="option.transport === 'websocket'"
              class="truncate text-xs text-muted"
              >{{ hostOf(option.url) }}</span
            >
          </span>
        </button>
        <template v-if="option.transport === 'websocket' && !option.builtin">
          <button
            type="button"
            class="form-dismiss before:content-none"
            :aria-label="'Edit ' + option.name"
            @click="edit(option)"
          >
            <Icon name="edit" />
          </button>
          <button
            type="button"
            class="form-dismiss mr-1 before:content-none"
            :aria-label="'Delete ' + option.name"
            @click="remove(option)"
          >
            <Icon name="trash" />
          </button>
        </template>
      </div>
      <div class="my-1 border-t border-line"></div>
      <button
        type="button"
        role="menuitem"
        class="flex min-h-10 items-center gap-3 rounded-md px-3 text-left text-muted hover:bg-subtle hover:text-ink"
        @click="edit()"
      >
        <Icon name="plus" />Add bookmark…
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Icon, { type IconName } from "./ui/Icon.vue";
import UiButton from "./ui/Button.vue";
import BookmarkModal from "./BookmarkModal.vue";
import ConfirmModal from "./ConfirmModal.vue";
import {
  useConnectionStore,
  type ConnectionBookmark,
  type ConnectionOption,
} from "@/store/connection";

export default defineComponent({
  name: "ConnectButton",
  components: { Icon, UiButton },
  props: {
    connected: { type: Boolean, default: false },
    busy: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  emits: ["toggle"],
  setup() {
    return { connection: useConnectionStore() };
  },
  data() {
    return { open: false };
  },
  watch: {
    open(open: boolean) {
      if (open) document.addEventListener("pointerdown", this.onPointerDown);
      else document.removeEventListener("pointerdown", this.onPointerDown);
    },
    connected() {
      this.open = false;
    },
  },
  unmounted() {
    document.removeEventListener("pointerdown", this.onPointerDown);
  },
  methods: {
    iconFor(option: ConnectionOption): IconName {
      if (option.transport === "websocket") return "wifi";
      return option.transport === "ble" ? "bluetooth" : "usb";
    },
    hostOf(url: string) {
      try {
        return new URL(url).host;
      } catch {
        return url;
      }
    },
    describe(option: ConnectionOption) {
      return option.transport === "websocket"
        ? `${option.name} (${option.url})`
        : option.name;
    },
    onPointerDown(event: PointerEvent) {
      if (!(this.$refs.root as HTMLElement).contains(event.target as Node))
        this.open = false;
    },
    closeMenu(focus = false) {
      if (!this.open) return;
      this.open = false;
      if (focus) (this.$refs.toggle as HTMLButtonElement | undefined)?.focus();
    },
    select(id: string) {
      this.connection.select(id);
      this.closeMenu(true);
    },
    async edit(bookmark?: ConnectionBookmark) {
      this.closeMenu();
      const result = await this.$modal.show(BookmarkModal, { bookmark });
      if (result) {
        this.connection.select(
          this.connection.saveBookmark(result as ConnectionBookmark),
        );
      }
    },
    async remove(bookmark: ConnectionBookmark) {
      this.closeMenu();
      const choice = await this.$modal.show(ConfirmModal, {
        title: "Delete bookmark",
        message: `Remove “${bookmark.name}” (${bookmark.url})?`,
        actions: [{ label: "Delete", value: "delete", variant: "primary" }],
      });
      if (choice === "delete") this.connection.removeBookmark(bookmark.id);
    },
  },
});
</script>
