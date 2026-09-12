<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">Outputs</p>
      <tooltip
        class="card-header-icon"
        text="Configure output routing. Multirotors use fixed motor sources; rovers and wings can map motors, servos, and RX channels."
        size="lg"
      />
    </header>

    <div class="card-content">
      <div class="content column-narrow field-is-5">
        <div v-if="info.is_multi" class="columns is-variable is-5">
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
                      :options="outputOptionsFor(row.output)"
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
            :key="'output-mapping-' + mapping.outputIndex"
            class="output-row"
          >
            <div
              class="column is-6-desktop is-12-tablet output-settings-column"
            >
              <div class="output-fields">
                <div class="column">
                  <label class="label is-small">Output</label>
                  <input-select
                    v-model.number="mapping.output.target_output"
                    class="is-fullwidth"
                    :options="outputOptionsFor(mapping.output)"
                  ></input-select>
                </div>
                <div class="column">
                  <label class="label is-small">Protocol</label>
                  <input-select
                    v-model.number="mapping.output.protocol"
                    class="is-fullwidth"
                    :options="protocolOptionsForOutput(mapping.output)"
                    @update:model-value="
                      onProtocolChange(mapping.output, $event)
                    "
                  ></input-select>
                </div>
              </div>
              <div class="output-actions">
                <div
                  v-if="hasConfigurablePwm(mapping.output)"
                  class="column is-narrow invert-column"
                >
                  <input
                    :id="'output-invert-' + index"
                    type="checkbox"
                    class="switch is-small"
                    :checked="!!mapping.output.invert"
                    @change="
                      mapping.output.invert = mapping.output.invert ? 0 : 1
                    "
                  />
                  <label class="py-0" :for="'output-invert-' + index">
                    Invert
                  </label>
                </div>
                <button
                  class="button is-small is-light"
                  type="button"
                  @click="removeMapping(mapping)"
                >
                  Remove Output
                </button>
              </div>
            </div>
            <div class="column is-6-desktop is-12-tablet">
              <label class="label is-small">Mixes</label>
              <div
                v-for="(rule, ruleIndex) in mapping.rules"
                :key="'output-rule-' + index + '-' + ruleIndex"
                class="mix-fields"
              >
                <div v-if="usesWeightedSource(rule)" class="column is-3">
                  <input
                    class="input"
                    type="number"
                    step="1"
                    min="-100"
                    max="100"
                    :value="rule.weight ?? 100"
                    @input="setRuleWeight(rule, $event)"
                  />
                </div>
                <div class="column">
                  <input-select
                    :model-value="rule.source"
                    class="is-fullwidth"
                    :options="mixSourceOptions"
                    @update:model-value="
                      setMixerRuleSource(mapping, rule, $event)
                    "
                  ></input-select>
                </div>
                <div v-if="usesSourceIndex(rule)" class="column is-3">
                  <input-select
                    v-model.number="rule.source_index"
                    class="is-fullwidth"
                    :options="rxChannelOptions"
                  ></input-select>
                </div>
                <div class="column is-narrow mix-remove-column">
                  <button
                    class="button is-small is-light"
                    type="button"
                    @click="removeMixerRule(mapping, rule)"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <input-select
                v-if="mapping.rules.length === 0"
                :model-value="mapping.rule.source"
                class="is-fullwidth"
                :options="mixSourceOptions"
                @update:model-value="setMappingSource(mapping, $event)"
              ></input-select>
              <button
                v-if="mapping.rules.length > 0"
                class="button is-small"
                type="button"
                @click="addMixerRuleToOutput(mapping)"
              >
                Add Source
              </button>
            </div>
          </div>

          <button
            class="button is-small"
            type="button"
            :disabled="outputOptionsFor().length === 0"
            @click="addMapping"
          >
            Add Output
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

          <div v-if="info.is_multi" class="column is-6-desktop is-12-tablet">
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
          <div
            v-if="!info.is_multi && profile.profileVersionGt('0.3.0')"
            class="column is-6-desktop is-12-tablet"
          >
            <div class="field is-horizontal">
              <div class="field-label">
                <label class="label" for="servo-pwm-frequency">
                  Servo PWM Frequency
                </label>
              </div>
              <div class="field-body">
                <div class="field">
                  <div class="control is-expanded">
                    <input-select
                      id="servo-pwm-frequency"
                      v-model.number="profile.servo.pwm_rate_hz"
                      class="is-fullwidth"
                      :options="pwmOptions"
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
import { mergeFixedMotorMixer, useProfileStore } from "@/store/profile";
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
      const rules = this.profile.mixer.filter((rule) =>
        sources.includes(rule.source),
      );

      return this.profile.outputs
        .map((output, outputIndex) => {
          if (!this.isOutputConfigured(output)) {
            return null;
          }
          const outputRules = rules.filter(
            (rule) => rule.output_index === outputIndex,
          );
          return {
            rule:
              outputRules[0] ||
              this.newMixerRule({
                output_index: outputIndex,
                source: output_source_t.OUTPUT_SOURCE_NONE,
              }),
            rules: outputRules,
            output,
            outputIndex,
            placeholder: outputRules.length === 0,
          };
        })
        .filter(Boolean);
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
        return this.profile.has_legacy_motor_outputs
          ? Boolean(this.profile.motor?.invert_yaw)
          : this.profile.mixer.some(
              (rule) =>
                rule.output_index === 0 &&
                rule.source === output_source_t.OUTPUT_SOURCE_YAW &&
                rule.weight < 0,
            );
      },
      set(propsOut) {
        if (this.profile.has_legacy_motor_outputs) {
          this.profile.motor.invert_yaw = propsOut ? 1 : 0;
        } else {
          this.profile.mixer = mergeFixedMotorMixer(
            this.profile.mixer,
            propsOut,
          );
        }
      },
    },
    pwmOptions() {
      return [
        { value: 50, text: "50 Hz" },
        { value: 60, text: "60 Hz" },
        { value: 125, text: "125 Hz" },
        { value: 150, text: "150 Hz" },
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
    mixSourceOptions() {
      return this.sourceOptions.filter(
        (option) => option.value !== output_source_t.OUTPUT_SOURCE_NONE,
      );
    },
    sourceOptions() {
      if (this.info.is_wing) {
        return [
          { value: output_source_t.OUTPUT_SOURCE_NONE, text: "None" },
          { value: output_source_t.OUTPUT_SOURCE_THROTTLE, text: "Throttle" },
          { value: output_source_t.OUTPUT_SOURCE_ROLL, text: "Roll" },
          { value: output_source_t.OUTPUT_SOURCE_PITCH, text: "Pitch" },
          { value: output_source_t.OUTPUT_SOURCE_YAW, text: "Yaw" },
          { value: this.rxSource, text: "RX Channel" },
        ];
      }
      return [
        { value: output_source_t.OUTPUT_SOURCE_THROTTLE, text: "Throttle" },
        { value: output_source_t.OUTPUT_SOURCE_YAW, text: "Steering" },
        { value: this.rxSource, text: "RX Channel" },
      ];
    },
  },
  created() {
    if (this.info.is_multi) {
      if (this.profile.has_legacy_motor_outputs) {
        return;
      }
      this.motorOutputSources.forEach((row) => {
        this.fixedMotorOutput(row.motor - 1);
      });
      this.profile.mixer = mergeFixedMotorMixer(
        this.profile.mixer,
        this.propsOut,
      );
    } else {
      this.profile.outputs.forEach((output) => this.normalizeOutput(output));
    }
  },
  methods: {
    outputOptionsFor(currentOutput = undefined) {
      const used = new Set(
        this.profile.outputs
          .filter(
            (output) =>
              output !== currentOutput && this.isOutputConfigured(output),
          )
          .map((output) => output.target_output),
      );
      return this.outputOptions.filter(
        (option) =>
          option.value === currentOutput?.target_output ||
          !used.has(option.value),
      );
    },
    addMapping() {
      const available = this.outputOptionsFor()[0];
      if (!available) return;
      const fallbackIndex = Array.from(
        { length: this.profile.outputs.length + 1 },
        (_, i) => i,
      ).find((index) => !this.isOutputConfigured(this.profile.outputs[index]));
      this.profile.outputs[fallbackIndex] = this.newOutput(available.value);
    },
    addMixerRuleToOutput(mapping) {
      const usedSources = mapping.rules.map((rule) => rule.source);
      const source =
        this.sourceOptions.find(
          (option) =>
            option.value !== output_source_t.OUTPUT_SOURCE_NONE &&
            !usedSources.includes(option.value),
        )?.value ?? this.rxSource;
      const rule = this.newMixerRule({
        output_index: mapping.outputIndex,
        source,
      });
      this.profile.mixer.push(rule);
      mapping.rules.push(rule);
      mapping.rule = mapping.rules[0];
      mapping.placeholder = false;
    },
    newMixerRule(overrides = {}) {
      return {
        output_index: 0,
        source: output_source_t.OUTPUT_SOURCE_RX_CHANNEL,
        source_index: 0,
        weight: 100,
        ...overrides,
      };
    },
    newOutput(fallbackIndex, overrides = {}) {
      return {
        target_output: fallbackIndex,
        protocol: output_protocol_t.OUTPUT_PROTOCOL_PWM,
        invert: 0,
        trim: 0,
        min: -1000,
        max: 1000,
        ...overrides,
      };
    },
    isOutputConfigured(output) {
      return (
        !!output && output.protocol !== output_protocol_t.OUTPUT_PROTOCOL_NONE
      );
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
    outputForIndex(outputIndex) {
      let output = this.profile.outputs[outputIndex];
      if (!output) {
        output = this.newOutput(outputIndex);
        this.profile.outputs[outputIndex] = output;
      }
      return output;
    },
    fixedMotorOutput(fallbackIndex) {
      const output = this.outputForIndex(fallbackIndex);
      output.target_output ??= fallbackIndex;
      output.protocol = this.outputSupportsProtocol(
        output.target_output,
        output_protocol_t.OUTPUT_PROTOCOL_DSHOT,
      )
        ? output_protocol_t.OUTPUT_PROTOCOL_DSHOT
        : output_protocol_t.OUTPUT_PROTOCOL_BRUSHED;
      output.invert = 0;
      output.min = 0;
      output.max = 1000;
      return output;
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
        : this.fixedMotorOutput(motorIndex);
    },
    motorTargetOutput(motorIndex) {
      return this.profile.has_legacy_motor_outputs
        ? this.legacyMotorPins()[motorIndex]
        : this.fixedMotorOutput(motorIndex).target_output;
    },
    motorTargetOutputLabel(motorIndex) {
      const targetOutput = this.motorTargetOutput(motorIndex);
      return Number.isFinite(targetOutput) ? `S${targetOutput + 1}` : "S?";
    },
    hasConfigurablePwm(output) {
      return output.protocol !== output_protocol_t.OUTPUT_PROTOCOL_DSHOT;
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
          : protocols[1] ?? output_protocol_t.OUTPUT_PROTOCOL_NONE;
      }
      if (output.protocol === output_protocol_t.OUTPUT_PROTOCOL_DSHOT) {
        output.invert = 0;
      }
    },
    onProtocolChange(output, protocol) {
      output.protocol = protocol;
      this.normalizeOutput(output);
    },
    setRuleWeight(rule, event) {
      const target = event.target as HTMLInputElement;
      rule.weight = Math.round(Number(target.value || 0));
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
    removeMapping(mapping) {
      this.profile.mixer = this.profile.mixer.filter(
        (rule) => rule.output_index !== mapping.outputIndex,
      );
      Object.assign(mapping.output, {
        target_output: 0,
        protocol: output_protocol_t.OUTPUT_PROTOCOL_NONE,
        invert: 0,
        trim: 0,
        min: 0,
        max: 0,
      });
    },
    removeMixerRule(mapping, rule) {
      this.profile.mixer = this.profile.mixer.filter((r) => r !== rule);
      mapping.rules = mapping.rules.filter((r) => r !== rule);
      if (mapping.rules.length > 0) {
        mapping.rule = mapping.rules[0];
        return;
      }
      mapping.rule = this.newMixerRule({
        output_index: mapping.outputIndex,
        source: output_source_t.OUTPUT_SOURCE_NONE,
      });
      mapping.placeholder = true;
    },
    setMappingSource(mapping, source) {
      if (mapping.placeholder) {
        if (source === output_source_t.OUTPUT_SOURCE_NONE) {
          return;
        }
        const rule = this.newMixerRule({
          output_index: mapping.outputIndex,
          source,
        });
        this.profile.mixer.push(rule);
        mapping.rule = rule;
        mapping.placeholder = false;
        return;
      }
      mapping.rule.source = source;
    },
    setMixerRuleSource(mapping, rule, source) {
      if (source === output_source_t.OUTPUT_SOURCE_NONE) {
        this.removeMixerRule(mapping, rule);
        return;
      }
      rule.source = source;
      if (rule.source !== this.rxSource) {
        rule.source_index = 0;
      }
    },
    setMotorOutput(row, targetOutput) {
      if (this.profile.has_legacy_motor_outputs) {
        const pins = [...this.legacyMotorPins()];
        pins[row.motor - 1] = targetOutput;
        this.profile.motor.motor_pins = pins;
        return;
      }
      row.output.target_output = targetOutput;
      this.fixedMotorOutput(row.motor - 1);
    },
    usesSourceIndex(output) {
      return output.source === this.rxSource;
    },
    usesWeightedSource(rule) {
      return (
        rule.source !== output_source_t.OUTPUT_SOURCE_NONE &&
        rule.source !== this.rxSource
      );
    },
  },
});
</script>

<style lang="scss" scoped>
.output-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--bulma-border-weak);
}

.output-row > .column,
.output-fields > .column,
.mix-fields > .column {
  padding: 0;
  width: auto;
  min-width: 0;
}

.output-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.output-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 2rem;
}

.output-actions > .button {
  margin-left: auto;
}

.output-row .label {
  margin-bottom: 0.5rem;
}

.output-settings-column .invert-column {
  padding: 0;
}

.mix-fields {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.mix-fields > .is-3 {
  flex: 0 0 5rem;
}

.mix-fields > .is-narrow {
  flex: none;
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

@media (max-width: 1023px) {
  .output-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}
</style>
