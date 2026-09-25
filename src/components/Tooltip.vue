<template>
  <span
    ref="tooltipContainer"
    class="tooltip"
    v-if="active"
    @mouseenter="visbleHover = true"
    @mouseleave="visbleHover = false"
    @click="onClick"
  >
    <slot>
      <span
        class="tooltip-icon"
        :class="{ 'text-danger': danger, 'text-muted': !danger }"
        :id="'tooltip-' + entry"
      >
        <font-awesome-icon
          icon="fa-solid fa-circle-question"
          :size="size"
          fixed-width
        />
      </span>
    </slot>

    <Teleport to="body">
      <Transition name="tooltip">
        <span
          ref="tooltipContent"
          class="tooltip-text text-center text-ink bg-panel border border-line"
          v-if="visible"
          :style="placementStyle"
          role="tooltip"
        >
          <span v-if="!danger">
            {{ tooltip.text }}
            <div v-if="tooltip.link">
              <a target="_blank" :href="tooltip.link">read more</a>
            </div>
          </span>
          <span v-else> Missing tooltip entry {{ entry }} </span>
        </span>
      </Transition>
    </Teleport>
  </span>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import tooltipEntries from "@/assets/tooltips.json";

export default defineComponent({
  props: {
    text: String,
    entry: String,
    size: String,
  },
  setup() {
    return {};
  },
  data() {
    return {
      placementStyle: {},
      visbleClick: false,
      visbleHover: false,
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
      return this.visbleClick || this.visbleHover;
    },
    active() {
      return (
        (this.text || this.entry) && (!this.tooltip || !this.tooltip.disabled)
      );
    },
  },
  methods: {
    updatePosition() {
      const anchor = this.$refs.tooltipContainer as HTMLElement;
      const content = this.$refs.tooltipContent as HTMLElement;
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
    onClick() {
      if (this.$slots.default) {
        return;
      }
      this.visbleClick = !this.visbleClick;
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
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.updatePosition);
    window.removeEventListener("scroll", this.updatePosition, true);
  },
});
</script>

<style lang="scss">
.tooltip {
  position: relative;
  display: inline-block;
  .tooltip-icon {
    cursor: pointer;
  }
}
.tooltip-text {
  position: fixed;
  width: min(280px, calc(100vw - 24px));
  max-height: calc(100dvh - 24px);
  overflow-y: auto;
  overflow-wrap: anywhere;
  white-space: pre-line;
  font-size: 12px;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 6px;
  z-index: 1001;
}
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.15s ease;
}
.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
</style>
