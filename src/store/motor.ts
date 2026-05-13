import { QuicCmd, QuicMotor, QuicVal } from "./serial/quic";
import { serial } from "./serial/serial";
import { Log } from "@/log";
import { defineStore } from "pinia";
import { useRootStore } from "./root";
import { useProfileStore } from "./profile";
import { output_protocol_t, output_source_t } from "./types";
import { useInfoStore } from "./info";

const OUTPUT_COUNT = 8;

const MULTI_PINS = [
  {
    index: 0,
    source: 0,
    id: "MOTOR_1",
    label: "M1 (Back Left)",
  },
  {
    index: 1,
    source: 1,
    id: "MOTOR_2",
    label: "M2 (Front Left)",
  },
  {
    index: 2,
    source: 2,
    id: "MOTOR_3",
    label: "M3 (Back Right)",
  },
  {
    index: 3,
    source: 3,
    id: "MOTOR_4",
    label: "M4 (Front Right)",
  },
];

const ROVER_PINS = [
  {
    index: 0,
    source: output_source_t.OUTPUT_SOURCE_THROTTLE,
    id: "THROTTLE",
    label: "Throttle",
    bidirectional: true,
  },
  {
    index: 3,
    source: output_source_t.OUTPUT_SOURCE_YAW,
    id: "SERVO",
    label: "Steering",
    bidirectional: true,
  },
];

const WING_SOURCE_LABELS = {
  [output_source_t.OUTPUT_SOURCE_THROTTLE]: "Throttle",
  [output_source_t.OUTPUT_SOURCE_ROLL]: "Roll",
  [output_source_t.OUTPUT_SOURCE_PITCH]: "Pitch",
  [output_source_t.OUTPUT_SOURCE_YAW]: "Yaw",
  [output_source_t.OUTPUT_SOURCE_RX_CHANNEL]: "RX",
};

function wingOutputTestPins(profile) {
  return profile.outputs
    .map((output, outputIndex) => {
      if (
        !output ||
        output.protocol === output_protocol_t.OUTPUT_PROTOCOL_NONE
      ) {
        return null;
      }

      const mixes = profile.mixer
        .filter((rule) => rule.output_index === outputIndex)
        .map((rule) => WING_SOURCE_LABELS[rule.source])
        .filter(Boolean);
      const mixLabel =
        mixes.length > 0 ? ` (${[...new Set(mixes)].join(" + ")})` : "";

      return {
        index: output.target_output,
        source: outputIndex,
        id: `OUTPUT_${outputIndex + 1}`,
        label: `S${output.target_output + 1}${mixLabel}`,
        testIndex: outputIndex,
        bidirectional:
          output.protocol === output_protocol_t.OUTPUT_PROTOCOL_PWM,
      };
    })
    .filter(Boolean);
}

export const useMotorStore = defineStore("motor", {
  state: () => ({
    loading: false,
    test: {
      active: 0,
      value: new Array<number>(),
    },
    settings: null as any,
  }),
  getters: {
    pins() {
      const info = useInfoStore();
      const profile = useProfileStore();
      if (info.is_wing) {
        return wingOutputTestPins(profile);
      }

      const pins = info.is_rover ? ROVER_PINS : MULTI_PINS;
      const legacyMotorOutputs =
        !info.is_rover && profile.has_legacy_motor_outputs;
      return pins.map((p) => {
        if (legacyMotorOutputs) {
          const pin = Array.isArray(profile.motor?.motor_pins)
            ? profile.motor.motor_pins[p.index]
            : undefined;
          return {
            ...p,
            pin,
            testIndex: p.index,
          };
        }

        const rule = profile.mixer.find((r) => r.source === p.source);
        const output = profile.outputs[p.index];
        const logicalIndex = info.is_rover
          ? (rule?.output_index ?? p.index)
          : p.index;
        const mappedOutput = profile.outputs[logicalIndex];
        const index =
          mappedOutput?.target_output ?? output?.target_output ?? p.index;
        return {
          ...p,
          index,
          pin: index,
          testIndex: p.testIndex ?? logicalIndex,
        };
      });
    },
  },
  actions: {
    fetch_motor_test() {
      return serial.command(QuicCmd.Motor, QuicMotor.TestStatus).then((p) => {
        this.test = p.payload[0];
      });
    },
    fetch_motor_settings() {
      const root = useRootStore();
      this.loading = true;

      return serial
        .get(QuicVal.BLHeliSettings)
        .then((settings) => {
          this.settings = settings;
        })
        .catch((err) => {
          root.append_alert({
            type: "danger",
            msg: "Loading motor settings failed!",
          });
          Log.error("motor", err);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    apply_motor_settings(settings) {
      const root = useRootStore();
      this.loading = true;

      return serial
        .set(QuicVal.BLHeliSettings, ...settings)
        .then(() => {
          this.settings = settings;
          root.append_alert({
            type: "success",
            msg: "Motor settings applied!",
          });
        })
        .catch((err) => {
          Log.error("motor", err);
          root.append_alert({
            type: "danger",
            msg: "Failed to apply motor settings!",
          });
        })
        .finally(() => {
          this.loading = false;
        });
    },
    async motor_test_toggle() {
      await this.fetch_motor_test();
      return serial
        .command(
          QuicCmd.Motor,
          this.test.active ? QuicMotor.TestDisable : QuicMotor.TestEnable,
        )
        .then(() => {
          this.test.active = this.test.active ? 0 : 1;
          const info = useInfoStore();
          if (info.is_rover || info.is_wing) {
            this.test.value = Array(OUTPUT_COUNT).fill(0);
          }
        });
    },
    motor_test_set_value(value) {
      return serial
        .command(QuicCmd.Motor, QuicMotor.TestSetValue, value)
        .then((p) => {
          this.test.value = p.payload[0];
        });
    },
  },
});
