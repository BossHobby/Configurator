<template>
  <div v-if="motor.test" class="card">
    <header class="card-header">
      <p class="card-header-title">
        {{ testTitle }}
      </p>
      <small class="card-header-icon">
        {{ state.vbat.toFixed(2) }}V <br />
        {{ state.ibat_filtered.toFixed(2) }}mA
      </small>
      <tooltip class="card-header-icon" entry="motor.test" size="lg" />
    </header>

    <div class="card-content">
      <div class="content">
        <template v-if="outputTestPins.length">
          <div
            v-for="m in outputTestPins"
            :key="'motor-test-' + m.source"
            class="field field-is-2 is-horizontal mb-5"
          >
            <div class="field-label">
              <label class="label">{{ m.label }}</label>
              <p v-if="m.direction" class="help">
                {{ directionLabel(m.direction.requestedDirection) }}
              </p>
            </div>
            <div class="field-body">
              <div class="field has-addons">
                <div class="control is-expanded">
                  <input
                    :id="m.id"
                    :value="getValuePercent(m.testIndex)"
                    class="input"
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
                <div class="control">
                  <input
                    :id="m.id + '-num'"
                    :value="formatValuePercent(m.testIndex)"
                    class="input"
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
              <div v-if="m.direction" class="field">
                <div class="buttons">
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
          <div class="is-size-5 has-text-centered has-text-weight-semibold">
            {{ testTitle + " disabled" }}
          </div>
        </template>
      </div>
    </div>

    <footer class="card-footer">
      <span class="card-footer-item"></span>
      <span class="card-footer-item"></span>
      <spinner-btn
        class="card-footer-item"
        :disabled="motor.loading"
        @click="motor.motor_test_toggle()"
      >
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
