<template>
  <span
    ref="tooltipContainer"
    class="tooltip"
    :class="placmentClass"
    v-if="active"
    @mouseenter="visbleHover = true"
    @mouseleave="visbleHover = false"
    @click="onClick"
  >
    <slot>
      <span
        class="tooltip-icon"
        :class="{ 'has-text-danger': danger, 'has-text-grey': !danger }"
        :id="'tooltip-' + entry"
      >
        <font-awesome-icon
          icon="fa-solid fa-circle-question"
          :size="size"
          fixed-width
        />
      </span>
    </slot>

    <Transition name="tooltip">
      <span
        ref="tooltipContent"
        class="tooltip-text has-text-centered has-text-light has-background-dark"
        v-visible="visible"
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
  </span>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import tooltipEntries from "@/assets/tooltips.json";

const visible = {
  updated(el, { value, oldValue }, { transition }) {
    if (value === oldValue) {
      return;
    }

    if (value) {
      transition.beforeEnter(el);
      el.style.visibility = "visible";
      transition.enter(el);
    } else {
      transition.leave(el, () => {
        el.style.visibility = "hidden";
      });
    }
  },
};

export default defineComponent({
  props: {
    text: String,
    entry: String,
    size: String,
  },
  directives: {
    visible,
  },
  setup() {
    return {};
  },
  data() {
    return {
      placmentClass: {},
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
    onClick() {
      if (this.$slots.default) {
        return;
      }
      this.visbleClick = !this.visbleClick;
    },
  },
  mounted() {
    const offset = (this.$refs.tooltipContainer as HTMLElement)?.offsetTop;
    const height = (this.$refs.tooltipContent as HTMLElement)?.clientHeight;

    const top = offset >= height;
    this.placmentClass = {
      "tooltip-bottom": !top,
      "tooltip-top": top,
    };
  },
});
</script>

<style lang="scss">
@use "sass:math";

.tooltip {
  position: relative;
  display: inline-block;

  .tooltip-icon {
    cursor: pointer;
  }

  .tooltip-text {
    position: absolute;
    display: inline-block;
    white-space: pre-line;
    min-width: 160px;

    visibility: hidden;

    font-size: 0.85em;
    font-weight: 700;
    text-align: center;
    padding: 6px;
    border-radius: 6px;
    z-index: 1001;

    &::after {
      content: " ";
      position: absolute;

      margin-left: -5px;
      border-width: 5px;
      border-style: solid;
    }
  }

  &.tooltip-top {
    .tooltip-text {
      bottom: 100%;
      left: 54%;
      transform: translateX(-50%);

      &::after {
        top: 100%;
        left: 50%;
        border-color: hsl(0deg, 0%, 21%) transparent transparent transparent;
      }
    }
  }

  &.tooltip-bottom {
    .tooltip-text {
      top: 100%;
      left: 54%;
      transform: translateX(-50%);

      &::after {
        bottom: 100%;
        left: 50%;
        border-color: transparent transparent hsl(0deg, 0%, 21%) transparent;
      }
    }
  }
}

.tooltip-enter-active {
  transition: transform 0.4s ease-out, opacity 0.3s ease-out;
}

.tooltip-leave-active {
  transition: transform 0.35s ease-in, opacity 0.28s ease-out;
}

.tooltip-enter-from {
  transition: none;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
</style>
