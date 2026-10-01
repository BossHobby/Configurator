<template>
  <span
    v-if="active"
    ref="anchor"
    class="relative inline-flex align-middle"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
    @focusin="focus = true"
    @focusout="focus = false"
    @keydown.esc="close"
  >
    <slot>
      <button
        type="button"
        class="inline-flex size-4 items-center justify-center rounded-full"
        :class="danger ? 'text-danger' : 'text-muted hover:text-ink'"
        :aria-label="danger ? 'Missing help entry' : 'Help'"
        :aria-describedby="visible ? id : undefined"
        :aria-expanded="visible"
        @click.stop.prevent="pinned = !pinned"
      >
        <CircleHelp :size="14" :stroke-width="2" aria-hidden="true" />
      </button>
    </slot>

    <Teleport to="body">
      <Transition name="tooltip">
        <span
          v-if="visible"
          :id="id"
          ref="content"
          role="tooltip"
          class="tooltip-text fixed z-[1001] max-h-[calc(100dvh-24px)] overflow-y-auto rounded-md border border-line bg-panel px-3 py-2 text-xs font-medium whitespace-pre-line text-ink shadow-lg [overflow-wrap:anywhere]"
          :style="placementStyle"
          @mouseenter="hover = true"
          @mouseleave="hover = false"
        >
          <template v-if="!danger">
            {{ tooltip.text }}
            <a
              v-if="tooltip.link"
              class="mt-1 block text-accent underline"
              target="_blank"
              rel="noreferrer"
              :href="tooltip.link"
              >Read more</a
            >
          </template>
          <template v-else>Missing tooltip entry {{ entry }}</template>
        </span>
      </Transition>
    </Teleport>
  </span>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { CircleHelp } from "@lucide/vue";
import tooltipEntries from "@/assets/tooltips.json";

let nextId = 0;

export default defineComponent({
  components: { CircleHelp },
  props: {
    text: { type: String, default: undefined },
    entry: { type: String, default: undefined },
  },
  data() {
    return {
      id: `tooltip-${nextId++}`,
      placementStyle: {},
      hover: false,
      focus: false,
      pinned: false,
    };
  },
  computed: {
    tooltip() {
      if (this.text) {
        return { text: this.text };
      }
      return tooltipEntries[this.entry];
    },
    danger() {
      return !this.tooltip || !this.tooltip.text;
    },
    visible() {
      return this.pinned || this.hover || this.focus;
    },
    active() {
      return (
        (this.text || this.entry) && (!this.tooltip || !this.tooltip.disabled)
      );
    },
  },
  watch: {
    visible(value) {
      if (value) this.$nextTick(this.updatePosition);
    },
  },
  mounted() {
    window.addEventListener("resize", this.updatePosition);
    window.addEventListener("scroll", this.updatePosition, true);
    document.addEventListener("pointerdown", this.onOutside, true);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.updatePosition);
    window.removeEventListener("scroll", this.updatePosition, true);
    document.removeEventListener("pointerdown", this.onOutside, true);
  },
  methods: {
    close() {
      this.pinned = this.hover = this.focus = false;
    },
    onOutside(event: PointerEvent) {
      if (!this.pinned) return;
      const target = event.target as Node;
      const anchor = this.$refs.anchor as HTMLElement | undefined;
      const content = this.$refs.content as HTMLElement | undefined;
      if (anchor?.contains(target) || content?.contains(target)) return;
      this.pinned = false;
    },
    updatePosition() {
      const anchor = this.$refs.anchor as HTMLElement;
      const content = this.$refs.content as HTMLElement;
      if (!this.visible || !anchor || !content) return;
      const rect = anchor.getBoundingClientRect();
      const margin = 12;
      const width = Math.min(280, window.innerWidth - margin * 2);
      const left = Math.max(
        margin,
        Math.min(
          rect.left + (rect.width - width) / 2,
          window.innerWidth - width - margin,
        ),
      );
      const height = content.offsetHeight;
      const top =
        rect.top >= height + margin + 8
          ? rect.top - height - 8
          : Math.min(rect.bottom + 8, window.innerHeight - height - margin);
      this.placementStyle = {
        width: `${width}px`,
        left: `${left}px`,
        top: `${Math.max(margin, top)}px`,
      };
    },
  },
});
</script>

<style>
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.15s ease;
}
.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
</style>
