<template>
  <div
    v-if="motor.test"
    class="min-w-0 rounded-lg border border-line bg-panel text-ink"
  >
    <header
      class="flex items-center justify-between gap-3 px-4 py-3 border-b border-line"
    >
      <p class="text-sm font-semibold">
        {{ testTitle }}
      </p>
      <small class="shrink-0 text-muted">
        {{ state.vbat.toFixed(2) }}V <br />
        {{ state.ibat_filtered.toFixed(2) }}mA
      </small>
      <tooltip class="shrink-0 text-muted" entry="motor.test" size="lg" />
    </header>

    <div class="p-4">
      <div class="space-y-4">
        <template v-if="outputTestPins.length">
          <div
            v-for="m in outputTestPins"
            :key="'motor-test-' + m.source"
            class="form-row mb-5"
          >
            <div class="form-label">
              <label class="text-sm font-medium text-ink">{{ m.label }}</label>
              <p v-if="m.direction" class="mt-1 text-xs text-muted">
                {{ directionLabel(m.direction.requestedDirection) }}
              </p>
            </div>
            <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              <div class="min-w-0 flex-1 flex items-center gap-2">
                <div class="min-w-0 flex-1">
                  <input
                    :id="m.id"
                    :value="getValuePercent(m.testIndex)"
                    class="form-input"
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
                </div>
                <div class="min-w-0">
                  <input
                    :id="m.id + '-num'"
                    :value="formatValuePercent(m.testIndex)"
                    class="form-input"
                    :disabled="motor.loading || !motor.test.active"
                    type="text"
                    @change="
                      setValuePercent(
                        m.testIndex,
                        parseValuePercent(
                          ($event.target as HTMLInputElement).value,
                        ),
                      )
                    "
                  />
                </div>
              </div>
              <div v-if="m.direction" class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <spinner-btn
                    :disabled="motor.loading"
                    @click="
                      motor.set_motor_direction(m.testIndex, direction.Normal)
                    "
                  >
                    Set normal
                  </spinner-btn>
                  <spinner-btn
                    :disabled="motor.loading"
                    @click="
                      motor.set_motor_direction(m.testIndex, direction.Reversed)
                    "
                  >
                    Set reversed
                  </spinner-btn>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="text-lg text-center font-semibold">
            {{ testTitle + " disabled" }}
          </div>
        </template>
      </div>
    </div>

    <footer
      class="flex flex-wrap items-center justify-end gap-2 border-t border-line p-3"
    >
      <spinner-btn :disabled="motor.loading" @click="motor.motor_test_toggle()">
        {{ motor.test.active ? "Disable" : "Enable" }}
      </spinner-btn>
    </footer>
  </div>
</template>

<script lang="ts">
import { useMotorStore } from "@/store/motor";
import { useStateStore } from "@/store/state";
import { useInfoStore } from "@/store/info";
import { defineComponent } from "vue";
import { MotorDirection } from "@/store/serial/quic";

export default defineComponent({
  name: "MotorTest",
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
