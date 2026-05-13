<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Outputs</p>
      <tooltip
        class="card-header-icon"
        text="Configure output routing. Multirotors use fixed motor sources; rovers can map throttle, steering, and RX channels."
        size="lg"
      />
    </header>

    <div class="card-content">
      <div class="content column-narrow field-is-5">
        <div v-if="!info.is_rover" class="columns is-variable is-5">
          <div class="column is-5 has-text-centered">
            <h4>Props {{ propsOut ? "Out" : "In" }}</h4>

            <svg
              class="prop-direction-graphic"
              viewBox="0 0 135.46665 135.46665"
              role="img"
              :aria-label="propsOut ? 'Props out' : 'Props in'"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                class="frame"
                d="M 108.49869,108.49869 26.967982,26.967982"
              />
              <path
                class="frame"
                d="M 26.967982,108.49869 108.49869,26.967982"
              />

              <g
                v-for="prop in propDirectionMarkers"
                :key="prop.label"
                class="prop-marker"
                :transform="prop.transform"
              >
                <circle cx="33.959526" cy="101.60001" r="13.229167" />
                <path :d="prop.arrowA" />
                <path :d="prop.arrowB" />
              </g>

              <text
                v-for="label in motorOutputLabels"
                :key="label.motor"
                class="motor-label"
                :x="label.x"
                :y="label.y"
              >
                {{ label.text }}
              </text>
            </svg>
          </div>

          <div class="column">
            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label"> Prop Direction </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      id="invert-yaw"
                      v-model.number="propDirectionMode"
                      class="is-fullwidth"
                      :options="invertYawModes"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              v-for="row in motorOutputRows"
              :key="'motor-output-' + row.motor"
              class="field is-horizontal"
            >
              <div class="field-label">
                <label class="label"
                  >M{{ row.motor }} ({{ row.position }})</label
                >
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      v-model.number="row.output.target_output"
                      class="is-fullwidth"
                      :options="outputOptions"
                      @update:model-value="setMotorOutput(row, $event)"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else>
          <div
            v-for="(mapping, index) in mappedOutputs"
            :key="'output-mapping-' + index"
            class="columns is-mobile is-vcentered is-variable is-4 mb-2 output-row"
          >
            <div class="column is-3-desktop is-4-tablet is-12-mobile">
              <label class="label is-small">Source</label>
              <input-select
                v-model.number="mapping.rule.source"
                class="is-fullwidth"
                :options="sourceOptions"
              ></input-select>
            </div>
            <div v-if="usesSourceIndex(mapping.rule)" class="column">
              <label class="label is-small">Channel</label>
              <input-select
                v-model.number="mapping.rule.source_index"
                class="is-fullwidth"
                :options="rxChannelOptions"
              ></input-select>
            </div>
            <div class="column">
              <label class="label is-small">Output</label>
              <input-select
                v-model.number="mapping.output.target_output"
                class="is-fullwidth"
                :options="outputOptions"
                @update:model-value="normalizeOutput(mapping.output)"
              ></input-select>
            </div>
            <div class="column">
              <label class="label is-small">Protocol</label>
              <input-select
                v-model.number="mapping.output.protocol"
                class="is-fullwidth"
                :options="protocolOptionsForOutput(mapping.output)"
                @update:model-value="onProtocolChange(mapping.output, $event)"
              ></input-select>
            </div>
            <div v-if="hasPwmFrequency(mapping.output)" class="column">
              <label class="label is-small">PWM Frequency</label>
              <input-select
                v-model.number="mapping.output.rate_hz"
                class="is-fullwidth"
                :options="pwmOptions"
              ></input-select>
            </div>
            <div
              v-if="hasOutputInvert(mapping.output)"
              class="column is-narrow invert-column"
            >
              <input
                :id="'output-invert-' + index"
                type="checkbox"
                class="switch is-small"
                :checked="!!mapping.output.invert"
                @change="mapping.output.invert = mapping.output.invert ? 0 : 1"
              />
              <label class="py-0" :for="'output-invert-' + index">Invert</label>
            </div>
            <div class="column is-narrow remove-column">
              <button
                class="button is-small is-light"
                type="button"
                @click="removeMapping(mapping.rule)"
              >
                Remove
              </button>
            </div>
          </div>

          <button class="button is-small" type="button" @click="addMapping">
            Add Mapping
          </button>
        </div>

        <div class="columns is-multiline is-variable is-5 settings-grid">
          <div class="column is-6-desktop is-12-tablet">
            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label">
                  Digital Idle
                  <tooltip entry="motor.digital_idle" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      id="digital-idle"
                      v-model.number="profile.motor.digital_idle"
                      class="input"
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="
              !info.is_rover &&
              info.quic_protocol_version > 1 &&
              info.has_feature(constants.Features.BRUSHLESS)
            "
            class="column is-6-desktop is-12-tablet"
          >
            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label">
                  DShot Time
                  <tooltip entry="motor.dshot_time" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      id="dshot-time"
                      v-model="profile.motor.dshot_time"
                      class="is-fullwidth"
                      :options="dshotTimes"
                    ></input-select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!info.is_rover" class="column is-6-desktop is-12-tablet">
            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label">
                  Turtle Throttle Percent
                  <tooltip entry="motor.turtle_throttle_percent" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      id="turtle-throttle-percent"
                      v-model.number="profile.motor.turtle_throttle_percent"
                      class="input"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="profile.profileVersionGt('0.2.0')"
            class="column is-6-desktop is-12-tablet"
          >
            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label">
                  Motor Limit Percent
                  <tooltip entry="motor.motor_limit" />
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input
                      id="motor-limit-percent"
                      v-model.number="profile.motor.motor_limit"
                      class="input"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useConstantStore } from "@/store/constants";
import { useInfoStore } from "@/store/info";
import { useProfileStore } from "@/store/profile";
import { useTargetStore } from "@/store/target";
import { output_protocol_t, output_source_t } from "@/store/types";

export default defineComponent({
  name: "OutputMapping",
  setup() {
    return {
      constants: useConstantStore(),
      info: useInfoStore(),
      profile: useProfileStore(),
      target: useTargetStore(),
    };
  },
  data() {
    return {
      invertYawModes: [
        { value: 0, text: "Props In" },
        { value: 1, text: "Props Out" },
      ],
      dshotTimes: [
        { value: 150, text: "150" },
        { value: 300, text: "300" },
        { value: 600, text: "600" },
      ],
    };
  },
  computed: {
    mappedOutputs() {
      const sources = this.sourceOptions.map((option) => option.value);
      return this.profile.mixer
        .filter((rule) => sources.includes(rule.source))
        .map((rule) => ({
          rule,
          output: this.outputForIndex(rule.output_index),
        }));
    },
    motorOutputRows() {
      return this.motorOutputSources.map((row) => ({
        ...row,
        output: this.motorOutput(row.motor - 1),
      }));
    },
    motorOutputSources() {
      return [
        {
          motor: 1,
          position: "Back Left",
        },
        {
          motor: 2,
          position: "Front Left",
        },
        {
          motor: 3,
          position: "Back Right",
        },
        {
          motor: 4,
          position: "Front Right",
        },
      ];
    },
    motorOutputLabels() {
      return [
        {
          motor: 1,
          x: 42,
          y: 96,
        },
        {
          motor: 2,
          x: 42,
          y: 40,
        },
        {
          motor: 3,
          x: 94,
          y: 96,
        },
        {
          motor: 4,
          x: 94,
          y: 40,
        },
      ].map((label) => ({
        ...label,
        text: `M${label.motor} / ${this.motorTargetOutputLabel(
          label.motor - 1,
        )}`,
      }));
    },
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
    propDirectionMarkers() {
      const propsIn = [
        {
          label: "props-in-bl",
          transform: "matrix(1.2037011,0,0,1.2037011,-13.909145,-13.640148)",
        },
        {
          label: "props-in-fr",
          transform: "matrix(-1.2037011,0,0,-1.2037011,149.37581,149.26403)",
        },
        {
          label: "props-in-br",
          transform: "matrix(-1.2037013,0,0,1.2037013,149.37582,-13.797383)",
        },
        {
          label: "props-in-fl",
          transform: "matrix(1.2037013,0,0,-1.2037013,-13.829304,149.26404)",
        },
      ];
      const propsOut = [
        {
          label: "props-out-fl",
          transform: "matrix(1.2037013,0,0,-1.2037013,-13.909145,149.65895)",
        },
        {
          label: "props-out-fr",
          transform: "matrix(-1.2037011,0,0,-1.2037011,149.37581,149.26403)",
        },
        {
          label: "props-out-br",
          transform: "matrix(-1.2037013,0,0,1.2037013,149.37582,-13.988638)",
        },
        {
          label: "props-out-bl",
          transform: "matrix(1.2037011,0,0,1.2037011,-13.909145,-13.842473)",
        },
      ];

      const clockwiseArrow = {
        arrowA: "m 25.42414,111.81499 0.346888,-6.75997",
        arrowB: "m 25.42414,111.81499 -6.759978,0.34689",
      };
      const counterClockwiseArrow = {
        arrowA: "m 22.533776,108.2281 -0.34689,6.75997",
        arrowB: "m 22.533776,108.2281 6.75997,-0.34689",
      };

      return (this.propsOut ? propsOut : propsIn).map((prop) => ({
        ...prop,
        ...(this.propsOut ? counterClockwiseArrow : clockwiseArrow),
      }));
    },
    propDirectionMode: {
      get() {
        return Number(this.propsOut);
      },
      set(value) {
        this.propsOut = Number(value) === 1;
      },
    },
    propsOut: {
      get() {
        if (this.profile.has_legacy_motor_outputs) {
          return Boolean(this.profile.motor?.invert_yaw);
        }
        const yawWeight = this.yawWeightForMotor(0);
        return yawWeight === 0 ? false : yawWeight < 0;
      },
      set(propsOut) {
        if (this.profile.has_legacy_motor_outputs) {
          this.profile.motor.invert_yaw = propsOut ? 1 : 0;
        } else {
          this.setPropDirection(propsOut);
        }
      },
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
    rxChannelOptions() {
      return Array.from({ length: 16 }, (_, i) => ({
        value: i,
        text: `CH${i + 1}`,
      }));
    },
    rxSource() {
      return output_source_t.OUTPUT_SOURCE_RX_CHANNEL;
    },
    sourceOptions() {
      return [
        { value: output_source_t.OUTPUT_SOURCE_THROTTLE, text: "Throttle" },
        { value: output_source_t.OUTPUT_SOURCE_YAW, text: "Steering" },
        { value: this.rxSource, text: "RX Channel" },
      ];
    },
  },
  created() {
    if (this.info.is_rover) {
      this.normalizeExistingOutputs();
      this.ensureDefaultMappings();
    } else {
      this.ensureFixedMotorOutputs();
    }
  },
  methods: {
    addMapping() {
      const usedOutputs = this.profile.mixer.map((rule) => rule.output_index);
      const fallbackIndex = Array.from(
        { length: this.profile.outputs.length },
        (_, i) => i,
      ).find((index) => !usedOutputs.includes(index));
      const rule = this.createMixerRule({
        output_index: fallbackIndex ?? 0,
      });
      this.profile.mixer.push(rule);
      this.ensureOutputForRule(rule);
    },
    createMixerRule(overrides = {}) {
      return {
        output_index: 0,
        source: output_source_t.OUTPUT_SOURCE_RX_CHANNEL,
        source_index: 0,
        weight: 100,
        ...overrides,
      };
    },
    createOutput(fallbackIndex, overrides = {}) {
      return {
        target_output: fallbackIndex,
        protocol: output_protocol_t.OUTPUT_PROTOCOL_PWM,
        invert: 0,
        trim: 0,
        min: -1000,
        max: 1000,
        rate_hz: 50,
        ...overrides,
      };
    },
    ensureDefaultMappings() {
      this.ensureMixerRule({
        source: output_source_t.OUTPUT_SOURCE_THROTTLE,
        output_index: 0,
      });
      this.ensureMixerRule({
        source: output_source_t.OUTPUT_SOURCE_YAW,
        output_index: 1,
      });
    },
    ensureFixedMotorOutput(fallbackIndex) {
      let output = this.profile.outputs[fallbackIndex];
      if (!output) {
        output = this.createOutput(fallbackIndex);
        this.profile.outputs.push(output);
      }

      output.target_output ??= fallbackIndex;
      output.protocol = this.motorProtocolForTarget(output.target_output);
      output.invert = 0;
      output.rate_hz = 0;
      output.min = 0;
      output.max = 1000;
      return output;
    },
    ensureFixedMotorOutputs() {
      if (this.info.is_rover || this.profile.has_legacy_motor_outputs) {
        return;
      }
      this.motorOutputSources.forEach((row) => {
        this.ensureFixedMotorOutput(row.motor - 1);
      });
      this.syncFixedMotorMixer(this.propsOut);
    },
    ensureMixerRule(rule) {
      if (
        this.profile.mixer.some(
          (r) =>
            r.source === rule.source &&
            (r.source_index ?? 0) === (rule.source_index ?? 0),
        )
      ) {
        return;
      }
      const mixerRule = this.createMixerRule(rule);
      this.profile.mixer.push(mixerRule);
      this.ensureOutputForRule(mixerRule);
    },
    ensureOutputForRule(rule) {
      this.outputForIndex(rule.output_index);
    },
    hasOutputInvert(output) {
      return output.protocol !== output_protocol_t.OUTPUT_PROTOCOL_DSHOT;
    },
    hasPwmFrequency(output) {
      return output.protocol !== output_protocol_t.OUTPUT_PROTOCOL_DSHOT;
    },
    normalizeExistingOutputs() {
      this.profile.outputs.forEach((output) => this.normalizeOutput(output));
    },
    normalizeOutput(output) {
      const protocols = this.protocolOptionsForOutput(output).map(
        (option) => option.value,
      );
      if (!protocols.includes(output.protocol)) {
        output.protocol = protocols.includes(
          output_protocol_t.OUTPUT_PROTOCOL_DSHOT,
        )
          ? output_protocol_t.OUTPUT_PROTOCOL_DSHOT
          : (protocols[1] ?? output_protocol_t.OUTPUT_PROTOCOL_NONE);
      }
      if (output.protocol === output_protocol_t.OUTPUT_PROTOCOL_DSHOT) {
        output.rate_hz = 0;
        output.invert = 0;
      }
    },
    onProtocolChange(output, protocol) {
      output.protocol = protocol;
      this.normalizeOutput(output);
    },
    legacyMotorPins() {
      return Array.isArray(this.profile.motor?.motor_pins)
        ? this.profile.motor.motor_pins
        : [];
    },
    legacyMotorOutput(motorIndex) {
      return {
        target_output: this.legacyMotorPins()[motorIndex],
      };
    },
    motorOutput(motorIndex) {
      return this.profile.has_legacy_motor_outputs
        ? this.legacyMotorOutput(motorIndex)
        : this.ensureFixedMotorOutput(motorIndex);
    },
    motorTargetOutput(motorIndex) {
      return this.profile.has_legacy_motor_outputs
        ? this.legacyMotorPins()[motorIndex]
        : this.ensureFixedMotorOutput(motorIndex).target_output;
    },
    motorTargetOutputLabel(motorIndex) {
      const targetOutput = this.motorTargetOutput(motorIndex);
      return Number.isFinite(targetOutput) ? `S${targetOutput + 1}` : "S?";
    },
    outputForIndex(outputIndex) {
      let output = this.profile.outputs[outputIndex];
      if (!output) {
        output = this.createOutput(outputIndex);
        this.profile.outputs.push(output);
      }
      return output;
    },
    outputSupportsProtocol(targetOutput, protocol) {
      const caps = this.target.outputs?.[targetOutput]?.caps ?? [];
      if (protocol === output_protocol_t.OUTPUT_PROTOCOL_DSHOT) {
        return caps.includes("dshot");
      }
      if (protocol === output_protocol_t.OUTPUT_PROTOCOL_BRUSHED) {
        return caps.includes("brushed");
      }
      if (protocol === output_protocol_t.OUTPUT_PROTOCOL_PWM) {
        return caps.includes("pwm");
      }
      return true;
    },
    motorProtocolForTarget(targetOutput) {
      return this.outputSupportsProtocol(
        targetOutput,
        output_protocol_t.OUTPUT_PROTOCOL_DSHOT,
      )
        ? output_protocol_t.OUTPUT_PROTOCOL_DSHOT
        : output_protocol_t.OUTPUT_PROTOCOL_BRUSHED;
    },
    protocolOptionsForOutput(output) {
      return [
        { value: output_protocol_t.OUTPUT_PROTOCOL_NONE, text: "Disabled" },
        ...(this.outputSupportsProtocol(
          output.target_output,
          output_protocol_t.OUTPUT_PROTOCOL_DSHOT,
        )
          ? [{ value: output_protocol_t.OUTPUT_PROTOCOL_DSHOT, text: "DShot" }]
          : []),
        ...(this.outputSupportsProtocol(
          output.target_output,
          output_protocol_t.OUTPUT_PROTOCOL_PWM,
        )
          ? [{ value: output_protocol_t.OUTPUT_PROTOCOL_PWM, text: "PWM" }]
          : []),
        ...(this.outputSupportsProtocol(
          output.target_output,
          output_protocol_t.OUTPUT_PROTOCOL_BRUSHED,
        )
          ? [
              {
                value: output_protocol_t.OUTPUT_PROTOCOL_BRUSHED,
                text: "Brushed",
              },
            ]
          : []),
      ];
    },
    removeMapping(rule) {
      const index = this.profile.mixer.indexOf(rule);
      if (index >= 0) {
        this.profile.mixer.splice(index, 1);
      }
    },
    setPropDirection(propsOut) {
      this.syncFixedMotorMixer(propsOut);
    },
    setMotorOutput(row, targetOutput) {
      if (this.profile.has_legacy_motor_outputs) {
        const pins = [...this.legacyMotorPins()];
        pins[row.motor - 1] = targetOutput;
        this.profile.motor.motor_pins = pins;
        return;
      }
      row.output.target_output = targetOutput;
      this.ensureFixedMotorOutput(row.motor - 1);
    },
    syncFixedMotorMixer(propsOut) {
      const sources = [
        output_source_t.OUTPUT_SOURCE_ROLL,
        output_source_t.OUTPUT_SOURCE_PITCH,
        output_source_t.OUTPUT_SOURCE_YAW,
      ];
      const weights = [
        [100, 100, propsOut ? -100 : 100],
        [100, -100, propsOut ? 100 : -100],
        [-100, 100, propsOut ? 100 : -100],
        [-100, -100, propsOut ? -100 : 100],
      ];

      this.profile.mixer = this.profile.mixer.filter(
        (rule) => rule.output_index >= 4 || !sources.includes(rule.source),
      );

      weights.forEach((motorWeights, outputIndex) => {
        sources.forEach((source, sourceIndex) => {
          this.profile.mixer.push(
            this.createMixerRule({
              output_index: outputIndex,
              source,
              source_index: 0,
              weight: motorWeights[sourceIndex],
            }),
          );
        });
      });
    },
    usesSourceIndex(output) {
      return output.source === this.rxSource;
    },
    yawWeightForMotor(outputIndex) {
      return (
        this.profile.mixer.find(
          (rule) =>
            rule.output_index === outputIndex &&
            rule.source === output_source_t.OUTPUT_SOURCE_YAW,
        )?.weight ?? 0
      );
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

.prop-direction-graphic {
  max-width: 400px;
  width: 100%;
}

.frame {
  fill: none;
  stroke: #7a7a7a;
  stroke-linecap: round;
  stroke-width: 11.1468;
}

.prop-marker {
  fill: none;
  stroke-width: 2.64583;
}

.prop-marker circle {
  stroke: #62a834;
}

.prop-marker path {
  stroke: #7a7a7a;
  stroke-linecap: round;
}

.motor-label {
  fill: #363636;
  font-size: 8px;
  font-weight: 700;
  paint-order: stroke;
  stroke: #fff;
  stroke-linejoin: round;
  stroke-width: 3px;
  text-anchor: middle;
}

.settings-grid {
  margin-top: 1rem;
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
