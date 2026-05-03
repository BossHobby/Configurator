<template>
  <div v-if="motor.test" class="card">
    <header class="card-header">
      <p class="card-header-title">
        {{ info.is_rover ? "Output Test" : "Motor Test" }}
      </p>
      <small class="card-header-icon">
        {{ state.vbat.toFixed(2) }}V <br />
        {{ state.ibat_filtered.toFixed(2) }}mA
      </small>
      <tooltip class="card-header-icon" entry="motor.test" size="lg" />
    </header>

    <div class="card-content">
      <div class="content">
        <template v-if="motor.test.active">
          <div
            v-for="m in outputTestPins"
            :key="'motor-test-' + m.index"
            class="field field-is-2 is-horizontal"
          >
            <div class="field-label">
              <label class="label">{{ m.label }}</label>
            </div>
            <div class="field-body">
              <div class="field has-addons">
                <div class="control is-expanded">
                  <input
                    :id="m.id"
                    :value="getValuePercent(m.index)"
                    class="input"
                    type="range"
                    step="1"
                    :min="isBidirectional(m.index) ? -100 : 0"
                    :max="isBidirectional(m.index) ? 100 : 50"
                    @input="
                      setValuePercent(
                        m.index,
                        Number(($event.target as HTMLInputElement).value),
                      )
                    "
                  />
                </div>
                <div class="control">
                  <input
                    :id="m.id + '-num'"
                    :value="getValuePercent(m.index)"
                    class="input"
                    type="number"
                    step="1"
                    :min="isBidirectional(m.index) ? -100 : 0"
                    :max="isBidirectional(m.index) ? 100 : 50"
                    @change="
                      setValuePercent(
                        m.index,
                        Number(($event.target as HTMLInputElement).value),
                      )
                    "
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="is-size-5 has-text-centered has-text-weight-semibold">
            {{ info.is_rover ? "Output Test disabled" : "Motor Test disabled" }}
          </div>
        </template>
      </div>
    </div>

    <footer class="card-footer">
      <span class="card-footer-item"></span>
      <span class="card-footer-item"></span>
      <spinner-btn class="card-footer-item" @click="motor.motor_test_toggle()">
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

export default defineComponent({
  name: "MotorTest",
  setup() {
    return {
      motor: useMotorStore(),
      state: useStateStore(),
      info: useInfoStore(),
    };
  },
  computed: {
    outputTestPins() {
      if (!this.info.is_rover) {
        return this.motor.pins;
      }
      return this.motor.pins.map((pin) => ({
        ...pin,
        label: pin.source === 1 ? "Throttle" : "Steering",
      }));
    },
  },
  created() {
    this.motor.fetch_motor_test();
  },
  methods: {
    isBidirectional(index: number): boolean {
      if (!this.info.is_rover) return false;
      return true;
    },
    getValuePercent(index: number): number {
      const raw = this.motor.test.value[index] ?? 0;
      const value = Math.round(raw * 100);
      if (this.isBidirectional(index)) {
        return Math.max(-100, Math.min(100, value));
      }
      return Math.max(0, Math.min(50, value));
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
