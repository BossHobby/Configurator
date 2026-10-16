import { defineStore } from "pinia";
import { WebSerial } from "./serial/webserial";
import type { ConnectionTarget } from "./serial/serial";

export interface ConnectionBookmark {
  id: string;
  name: string;
  transport: "websocket";
  url: string;
  builtin?: boolean;
}

export type ConnectionOption =
  | { id: "usb"; name: string; transport: "usb" }
  | ConnectionBookmark;

const BOOKMARKS_KEY = "connection-bookmarks";
const SELECTED_KEY = "connection-selected";

const USB: ConnectionOption = { id: "usb", name: "USB", transport: "usb" };

const BUILTIN_BOOKMARKS: ConnectionBookmark[] = [
  {
    id: "crossfire",
    name: "Crossfire Wi-Fi",
    transport: "websocket",
    url: "ws://192.168.4.1/ws",
    builtin: true,
  },
];

function load<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Bookmarks still work for this session without persistence. */
  }
}

export function usbSupported() {
  return !!(navigator.usb && WebSerial);
}

/** Accepts a bare host such as 192.168.4.1 and expands it to its /ws URL. */
export function normalizeWebsocketUrl(input: string) {
  const value = input.trim();
  if (/^wss?:\/\//i.test(value)) return value;
  return `ws://${value.replace(/\/+$/, "")}/ws`;
}

export const useConnectionStore = defineStore("connection", {
  state: () => ({
    bookmarks: load<ConnectionBookmark[]>(BOOKMARKS_KEY, []).filter(
      (b) => b && b.transport === "websocket" && b.url,
    ),
    selectedId: load<string>(SELECTED_KEY, ""),
  }),
  getters: {
    options(): ConnectionOption[] {
      return [
        ...(usbSupported() ? [USB] : []),
        ...BUILTIN_BOOKMARKS,
        ...this.bookmarks,
      ];
    },
    selected(): ConnectionOption {
      return (
        this.options.find((o) => o.id === this.selectedId) ?? this.options[0]
      );
    },
    target(): ConnectionTarget {
      const option = this.selected;
      return option.transport === "usb"
        ? { transport: "usb" }
        : { transport: "websocket", url: option.url };
    },
  },
  actions: {
    select(id: string) {
      this.selectedId = id;
      save(SELECTED_KEY, id);
    },
    saveBookmark(bookmark: Omit<ConnectionBookmark, "id"> & { id?: string }) {
      const id =
        bookmark.id ||
        Date.now().toString(36) + Math.random().toString(36).slice(2);
      const entry: ConnectionBookmark = {
        id,
        name: bookmark.name,
        transport: bookmark.transport,
        url: bookmark.url,
      };
      const index = this.bookmarks.findIndex((b) => b.id === id);
      if (index >= 0) this.bookmarks.splice(index, 1, entry);
      else this.bookmarks.push(entry);
      save(BOOKMARKS_KEY, this.bookmarks);
      return id;
    },
    removeBookmark(id: string) {
      this.bookmarks = this.bookmarks.filter((b) => b.id !== id);
      save(BOOKMARKS_KEY, this.bookmarks);
      if (this.selectedId === id) this.select(this.options[0].id);
    },
  },
});
