<template>
  <Panel v-if="motor.test" :title="testTitle" help="motor.test">
    <template #actions>
      <dl class="flex items-center gap-4 text-xs">
        <div class="flex items-baseline gap-1.5">
          <dt class="text-muted">Battery</dt>
          <dd class="font-medium tabular-nums">
            {{ state.vbat.toFixed(2) }} V
          </dd>
        </div>
        <div class="flex items-baseline gap-1.5">
          <dt class="text-muted">Current</dt>
          <dd class="font-medium tabular-nums">
            {{ state.ibat_filtered.toFixed(2) }} mA
          </dd>
        </div>
      </dl>
      <spinner-btn
        :variant="motor.test.active ? 'secondary' : 'primary'"
        :disabled="motor.loading"
        @click="motor.motor_test_toggle()"
      >
        {{ motor.test.active ? "Stop test" : "Enable test" }}
      </spinner-btn>
    </template>

    <template v-if="outputTestPins.length">
      <div
        class="mb-5 grid grid-cols-[auto_minmax(0,1fr)_4rem] items-center gap-3 rounded-md bg-subtle px-4 py-3"
      >
        <label
          class="inline-flex items-center gap-1.5 text-sm font-medium"
          for="motor-test-master"
          >Master <tooltip entry="motor.test_master"
        /></label>
        <input
          id="motor-test-master"
          :value="masterPercent"
          class="w-full"
          :disabled="motor.loading || !motor.test.active"
          type="range"
          step="1"
          min="0"
          max="50"
          @input="
            setAllPercent(Number(($event.target as HTMLInputElement).value))
          "
        />
        <output class="text-right text-sm tabular-nums" for="motor-test-master"
          >{{ masterPercent }}%</output
        >
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div
          v-for="m in outputTestGrid"
          :key="'motor-test-' + m.source"
          class="min-w-0 rounded-md border border-line p-3"
        >
          <div class="mb-2 flex items-baseline justify-between gap-2">
            <label class="text-sm font-medium" :for="m.id">{{ m.label }}</label>
            <input
              :id="m.id + '-num'"
              :value="formatValuePercent(m.testIndex)"
              :aria-label="m.label + ' value'"
              class="w-16 rounded border border-line bg-subtle px-2 py-1 text-right text-xs tabular-nums disabled:opacity-50"
              :disabled="motor.loading || !motor.test.active"
              type="text"
              @change="
                setValuePercent(
                  m.testIndex,
                  parseValuePercent(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <input
            :id="m.id"
            :value="getValuePercent(m.testIndex)"
            class="w-full"
            :disabled="motor.loading || !motor.test.active"
            type="range"
            step="1"
            :min="isBidirectional(m.testIndex) ? -100 : 0"
            :max="isBidirectional(m.testIndex) ? 100 : 50"
            @input="
              setValuePercent(
                m.testIndex,
                Number(($event.target as HTMLInputElement).value),
              )
            "
          />
          <div
            v-if="m.direction"
            class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3"
          >
            <span class="text-xs text-muted">{{
              directionLabel(m.direction.requestedDirection)
            }}</span>
            <div class="flex gap-1.5">
              <spinner-btn
                class="min-h-8 px-2 text-xs"
                :disabled="motor.loading"
                @click="
                  motor.set_motor_direction(m.testIndex, direction.Normal)
                "
                >Normal</spinner-btn
              >
              <spinner-btn
                class="min-h-8 px-2 text-xs"
                :disabled="motor.loading"
                @click="
                  motor.set_motor_direction(m.testIndex, direction.Reversed)
                "
                >Reversed</spinner-btn
              >
            </div>
          </div>
        </div>
      </div>
    </template>
    <p v-else class="py-6 text-center text-sm text-muted">
      {{ testTitle }} is not available for this configuration.
    </p>
  </Panel>
</template>

<script lang="ts">
import Panel from "@/components/ui/Panel.vue";
import { useMotorStore } from "@/store/motor";
import { useStateStore } from "@/store/state";
import { useInfoStore } from "@/store/info";
import { defineComponent } from "vue";
import { MotorDirection } from "@/store/serial/quic";

export default defineComponent({
  name: "MotorTest",
  components: { Panel },
  setup() {
    return {
      motor: useMotorStore(),
      state: useStateStore(),
      info: useInfoStore(),
      direction: MotorDirection,
    };
  },
  computed: {
    testTitle() {
      return this.info.is_rover || this.info.is_wing
        ? "Output Test"
        : "Motor Test";
    },
    masterPercent(): number {
      const unidirectional = this.outputTestPins.filter(
        (pin) => !pin.bidirectional,
      );
      if (!unidirectional.length) return 0;
      return Math.max(
        ...unidirectional.map((pin) => this.getValuePercent(pin.testIndex)),
      );
    },
    /**
     * Outputs ordered to mirror the craft from above: front row first, left
     * before right. Labels without a position keep their original order.
     */
    outputTestGrid() {
      const rank = (label: string) => {
        const l = label.toLowerCase();
        const row = l.includes("front") ? 0 : l.includes("back") ? 1 : 2;
        const col = l.includes("left") ? 0 : l.includes("right") ? 1 : 2;
        return row * 3 + col;
      };
      return [...this.outputTestPins].sort(
        (a, b) => rank(a.label) - rank(b.label),
      );
    },
    outputTestPins() {
      return this.motor.pins.map((pin) => ({
        ...pin,
        direction: this.motor.directionPins.find(
          (directionPin) => directionPin.testIndex === pin.testIndex,
        ),
      }));
    },
  },
  created() {
    this.motor.fetch_motor_test();
  },
  methods: {
    directionLabel(direction: MotorDirection | undefined): string {
      if (direction === undefined) {
        return "Direction: Unknown";
      }
      return `Direction: ${direction === MotorDirection.Normal ? "Normal" : "Reversed"}`;
    },
    isBidirectional(index: number): boolean {
      return !!this.outputTestPins.find((pin) => pin.testIndex === index)
        ?.bidirectional;
    },
    getValuePercent(index: number): number {
      const raw = this.motor.test.value[index] ?? 0;
      const value = Math.round(raw * 100);
      if (this.isBidirectional(index)) {
        return Math.max(-100, Math.min(100, value));
      }
      return Math.max(0, Math.min(50, value));
    },
    formatValuePercent(index: number): string {
      const value = this.getValuePercent(index);
      return value === 0 ? "Off" : `${value}%`;
    },
    parseValuePercent(value: string): number {
      if (value.trim().toLowerCase() === "off") {
        return 0;
      }
      return Number.parseInt(value, 10) || 0;
    },
    /** Drives every unidirectional output to the same value. */
    setAllPercent(value: number) {
      const next = [...(this.motor.test.value || [])];
      for (const pin of this.outputTestPins) {
        if (pin.bidirectional) continue;
        while (next.length <= pin.testIndex) next.push(0);
        next[pin.testIndex] = Math.max(0, Math.min(50, value)) / 100;
      }
      return this.motor.motor_test_set_value(next);
    },
    setValuePercent(index: number, value: number) {
      const clamped = this.isBidirectional(index)
        ? Math.max(-100, Math.min(100, value))
        : Math.max(0, Math.min(50, value));
      const next = [...(this.motor.test.value || [])];
      while (next.length <= index) {
        next.push(0);
      }
      next[index] = clamped / 100;
      return this.motor.motor_test_set_value(next);
    },
  },
});
</script>
