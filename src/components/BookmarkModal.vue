<template>
  <form
    role="dialog"
    aria-modal="true"
    :aria-labelledby="id + '-title'"
    class="relative z-10 w-full max-w-md rounded-lg border border-line bg-panel p-5 text-ink shadow-xl"
    @submit.prevent="submit"
  >
    <h2 :id="id + '-title'" class="text-base font-semibold">
      {{ bookmark ? "Edit bookmark" : "Add bookmark" }}
    </h2>
    <p class="mt-2 text-sm text-muted">
      Connects to the flight controller over the radio link through a CRSF
      WebSocket, such as a TBS Crossfire Wi-Fi module.
    </p>
    <div class="mt-4 flex flex-col gap-4">
      <label class="form-row">
        <span class="form-label">Name</span>
        <input
          ref="name"
          v-model="name"
          class="form-input"
          placeholder="Bench quad"
          autocomplete="off"
        />
      </label>
      <label class="form-row">
        <span class="form-label">Address</span>
        <input
          v-model="address"
          class="form-input font-mono"
          placeholder="192.168.4.1 or ws://192.168.4.1/ws"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          :aria-invalid="!!error || undefined"
        />
        <span v-if="error" class="text-xs text-danger">{{ error }}</span>
        <span v-else-if="address" class="text-xs text-muted">{{ url }}</span>
      </label>
    </div>
    <div class="mt-5 flex flex-wrap justify-end gap-2">
      <UiButton @click="$emit('close')">Cancel</UiButton>
      <UiButton type="submit" variant="primary" :disabled="!valid"
        >Save</UiButton
      >
    </div>
  </form>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import UiButton from "./ui/Button.vue";
import {
  normalizeWebsocketUrl,
  type ConnectionBookmark,
} from "@/store/connection";

let nextId = 0;

export default defineComponent({
  name: "BookmarkModal",
  components: { UiButton },
  props: {
    bookmark: {
      type: Object as PropType<ConnectionBookmark>,
      default: undefined,
    },
  },
  emits: ["close"],
  data() {
    return {
      id: `bookmark-${nextId++}`,
      name: this.bookmark?.name ?? "",
      address: this.bookmark?.url ?? "",
    };
  },
  computed: {
    url() {
      return normalizeWebsocketUrl(this.address);
    },
    error() {
      if (!this.address.trim()) return undefined;
      try {
        const url = new URL(this.url);
        if (!["ws:", "wss:"].includes(url.protocol) || !url.host)
          return "Enter a host or a ws:// address";
      } catch {
        return "Enter a host or a ws:// address";
      }
      return undefined;
    },
    valid() {
      return !!this.address.trim() && !this.error;
    },
  },
  mounted() {
    (this.$refs.name as HTMLInputElement).focus();
  },
  methods: {
    submit() {
      if (!this.valid) return;
      const url = this.url;
      this.$emit("close", {
        id: this.bookmark?.id,
        name: this.name.trim() || new URL(url).host,
        transport: "websocket",
        url,
      });
    },
  },
});
</script>
