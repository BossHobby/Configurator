<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Output Mapping</p>
      <tooltip
        class="card-header-icon"
        text="Select a control source and route it to any available output pin. Rover defaults to throttle on S1 and steering on S4."
        size="lg"
      />
    </header>

    <div class="card-content">
      <div class="content">
        <div
          v-for="(output, index) in mappedOutputs"
          :key="'output-mapping-' + index"
          class="columns is-mobile is-vcentered is-variable is-4 mb-2 output-row"
        >
          <div class="column is-3-desktop is-4-tablet is-12-mobile">
            <label class="label is-small">Source</label>
            <input-select
              v-model.number="output.source"
              class="is-fullwidth"
              :options="sourceOptions"
            ></input-select>
          </div>
          <div v-if="usesSourceIndex(output)" class="column">
            <label class="label is-small">Channel</label>
            <input-select
              v-model.number="output.source_index"
              class="is-fullwidth"
              :options="rxChannelOptions"
            ></input-select>
          </div>
          <div class="column">
            <label class="label is-small">Output</label>
            <input-select
              v-model.number="output.target_output"
              class="is-fullwidth"
              :options="outputOptions"
            ></input-select>
          </div>
          <div class="column">
            <label class="label is-small">Protocol</label>
            <input-select
              v-model.number="output.protocol"
              class="is-fullwidth"
              :options="protocolOptions"
              @update:model-value="onProtocolChange(output, $event)"
            ></input-select>
          </div>
          <div v-if="hasPwmFrequency(output)" class="column">
            <label class="label is-small">PWM Frequency</label>
            <input-select
              v-model.number="output.rate_hz"
              class="is-fullwidth"
              :options="pwmOptions"
            ></input-select>
          </div>
          <div
            v-if="hasOutputInvert(output)"
            class="column is-narrow invert-column"
          >
            <input
              :id="'output-invert-' + index"
              type="checkbox"
              class="switch is-small"
              :checked="!!output.invert"
              @change="output.invert = output.invert ? 0 : 1"
            />
            <label class="py-0" :for="'output-invert-' + index">Invert</label>
          </div>
          <div class="column is-narrow remove-column">
            <button
              class="button is-small is-light"
              type="button"
              @click="removeMapping(output)"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <footer class="card-footer">
      <span class="card-footer-item"></span>
      <span class="card-footer-item"></span>
      <button class="button card-footer-item" type="button" @click="addMapping">
        Add Mapping
      </button>
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useInfoStore } from "@/store/info";
import { useProfileStore } from "@/store/profile";
import { useTargetStore } from "@/store/target";
import { output_protocol_t, output_source_t } from "@/store/types";

export default defineComponent({
  name: "OutputMapping",
  setup() {
    return {
      info: useInfoStore(),
      profile: useProfileStore(),
      target: useTargetStore(),
    };
  },
  computed: {
    outputOptions() {
      return this.target.motor_pin_names
        .map((name: string, i: number) => ({
          index: i,
          name,
        }))
        .filter((p) => p.name && p.name !== "NONE")
        .map((p) => ({
          value: p.index,
          text: `S${p.index + 1}`,
        }));
    },
    protocolOptions() {
      return [
        { value: output_protocol_t.OUTPUT_PROTOCOL_NONE, text: "Disabled" },
        ...(this.target.brushless
          ? [{ value: output_protocol_t.OUTPUT_PROTOCOL_DSHOT, text: "DShot" }]
          : []),
        {
          value: output_protocol_t.OUTPUT_PROTOCOL_PWM,
          text: "PWM",
        },
        ...(!this.target.brushless
          ? [
              {
                value: output_protocol_t.OUTPUT_PROTOCOL_BRUSHED,
                text: "Brushed",
              },
            ]
          : []),
      ];
    },
    pwmOptions() {
      return [
        { value: 0, text: "Default" },
        { value: 50, text: "50 Hz" },
        { value: 60, text: "60 Hz" },
        { value: 125, text: "125 Hz" },
        { value: 165, text: "165 Hz" },
        { value: 250, text: "250 Hz" },
        { value: 333, text: "333 Hz" },
      ];
    },
    rxSource() {
      return this.info.is_rover
        ? output_source_t.OUTPUT_SOURCE_RX_CHANNEL_ROVER
        : output_source_t.OUTPUT_SOURCE_RX_CHANNEL_MULTI;
    },
    sourceOptions() {
      if (this.info.is_rover) {
        return [
          { value: output_source_t.OUTPUT_SOURCE_THROTTLE, text: "Throttle" },
          { value: output_source_t.OUTPUT_SOURCE_STEERING, text: "Steering" },
          { value: this.rxSource, text: "RX Channel" },
        ];
      }
      return [
        { value: output_source_t.OUTPUT_SOURCE_MOTOR_1, text: "Motor 1" },
        { value: output_source_t.OUTPUT_SOURCE_MOTOR_2, text: "Motor 2" },
        { value: output_source_t.OUTPUT_SOURCE_MOTOR_3, text: "Motor 3" },
        { value: output_source_t.OUTPUT_SOURCE_MOTOR_4, text: "Motor 4" },
        { value: this.rxSource, text: "RX Channel" },
      ];
    },
    rxChannelOptions() {
      return Array.from({ length: 16 }, (_, i) => ({
        value: i,
        text: `CH${i + 1}`,
      }));
    },
    mappedOutputs() {
      const sources = this.sourceOptions.map((option) => option.value);
      return this.profile.outputs.filter((o) => sources.includes(o.source));
    },
  },
  created() {
    this.normalizeExistingOutputs();
    this.ensureDefaultMappings();
  },
  methods: {
    usesSourceIndex(output) {
      return output.source === this.rxSource;
    },
    hasPwmFrequency(output) {
      return output.protocol !== output_protocol_t.OUTPUT_PROTOCOL_DSHOT;
    },
    hasOutputInvert(output) {
      return output.protocol !== output_protocol_t.OUTPUT_PROTOCOL_DSHOT;
    },
    normalizeOutput(output) {
      if (output.protocol === output_protocol_t.OUTPUT_PROTOCOL_DSHOT) {
        output.rate_hz = 0;
        output.invert = 0;
      }
    },
    normalizeExistingOutputs() {
      this.profile.outputs.forEach((output) => this.normalizeOutput(output));
    },
    onProtocolChange(output, protocol) {
      output.protocol = protocol;
      this.normalizeOutput(output);
    },
    ensureDefaultMappings() {
      if (this.info.is_rover) {
        this.ensureMapping({
          source: output_source_t.OUTPUT_SOURCE_THROTTLE,
          target_output: 0,
          protocol: output_protocol_t.OUTPUT_PROTOCOL_PWM,
          rate_hz: 50,
        });
        this.ensureMapping({
          source: output_source_t.OUTPUT_SOURCE_STEERING,
          target_output: 3,
          protocol: output_protocol_t.OUTPUT_PROTOCOL_PWM,
          rate_hz: 50,
        });
        return;
      }

      for (let i = 0; i < 4; i++) {
        this.ensureMapping({
          source: output_source_t.OUTPUT_SOURCE_MOTOR_1 + i,
          target_output: i,
          protocol: this.target.brushless
            ? output_protocol_t.OUTPUT_PROTOCOL_DSHOT
            : output_protocol_t.OUTPUT_PROTOCOL_BRUSHED,
          rate_hz: 0,
          min: 0,
          max: 1000,
        });
      }
    },
    ensureMapping(mapping) {
      if (
        this.profile.outputs.some(
          (o) =>
            o.source === mapping.source &&
            (o.source_index ?? 0) === (mapping.source_index ?? 0),
        )
      ) {
        return;
      }
      this.profile.outputs.push(this.createMapping(mapping));
    },
    createMapping(overrides = {}) {
      return {
        target_output: 0,
        source: this.rxSource,
        protocol: output_protocol_t.OUTPUT_PROTOCOL_PWM,
        source_index: 0,
        invert: 0,
        trim: 0,
        min: -1000,
        max: 1000,
        rate_hz: 50,
        ...overrides,
      };
    },
    addMapping() {
      const usedOutputs = this.profile.outputs.map((o) => o.target_output);
      const fallbackOutput = this.outputOptions.find(
        (option) => !usedOutputs.includes(option.value),
      );
      this.profile.outputs.push(
        this.createMapping({
          target_output: fallbackOutput?.value ?? 0,
        }),
      );
    },
    removeMapping(output) {
      const index = this.profile.outputs.indexOf(output);
      if (index >= 0) {
        this.profile.outputs.splice(index, 1);
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.output-row {
  padding-bottom: 0.75rem;
}

.invert-column {
  min-width: 8rem;
  padding-top: 1.9rem;
}

.remove-column {
  padding-top: 1.7rem;
}

@media (max-width: 768px) {
  .output-row {
    display: block;
  }

  .invert-column {
    padding-top: 0.75rem;
  }

  .remove-column {
    padding-top: 0.25rem;
  }
}
</style>
