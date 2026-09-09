import { MotorDirection, QuicCmd, QuicMotor } from "./serial/quic";
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
    requested_directions: {} as Record<number, MotorDirection>,
  }),
  getters: {
    directionPins() {
      const profile = useProfileStore();
      return this.pins
        .filter(
          (pin) =>
            profile.outputs[pin.testIndex]?.protocol ===
            output_protocol_t.OUTPUT_PROTOCOL_DSHOT,
        )
        .map((pin) => ({
          ...pin,
          requestedDirection:
            this.requested_directions[
              profile.outputs[pin.testIndex].target_output
            ],
        }));
    },
    pins() {
      const info = useInfoStore();
      const profile = useProfileStore();
      if (info.is_wing) {
        return wingOutputTestPins(profile);
      }

      const pins = info.is_rover ? ROVER_PINS : MULTI_PINS;
      if (!info.is_rover && profile.has_legacy_motor_outputs) {
        const motorPins = Array.isArray(profile.motor?.motor_pins)
          ? profile.motor.motor_pins
          : [];
        return pins.map((p) => ({
          ...p,
          pin: motorPins[p.index],
          testIndex: p.index,
        }));
      }

      return pins.map((p) => {
        const rule = profile.mixer.find((r) => r.source === p.source);
        const output = profile.outputs[p.index];
        const logicalIndex = info.is_rover
          ? rule?.output_index ?? p.index
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
    async set_motor_direction(index: number, direction: MotorDirection) {
      const root = useRootStore();
      if (this.loading) {
        return;
      }
      const targetOutput = useProfileStore().outputs[index].target_output;
      this.loading = true;
      // A failed or timed-out request may still have reached the ESC.
      delete this.requested_directions[targetOutput];
      try {
        await this.fetch_motor_test();
        const resumeTesting = !!this.test.active;
        if (resumeTesting) {
          await serial.command(QuicCmd.Motor, QuicMotor.TestDisable);
          this.test.active = 0;
          this.test.value.fill(0);
        }
        // Uses the logical output index, matching motor testing. Firmware maps the pin.
        await serial.command(
          QuicCmd.Motor,
          QuicMotor.SetDirection,
          index,
          direction,
        );
        this.requested_directions[targetOutput] = direction;
        if (resumeTesting) {
          await serial.command(QuicCmd.Motor, QuicMotor.TestEnable);
          await this.fetch_motor_test();
        }
        root.append_alert({
          type: "success",
          msg: "Direction command sent. Test the motor to verify rotation.",
        });
      } catch (err) {
        Log.error("motor", err);
        root.append_alert({
          type: "danger",
          msg: "Failed to set motor direction.",
        });
      } finally {
        this.loading = false;
      }
    },
    fetch_motor_test() {
      return serial.command(QuicCmd.Motor, QuicMotor.TestStatus).then((p) => {
        this.test = p.payload[0];
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
      if (this.loading) {
        return Promise.resolve();
      }
      return serial
        .command(QuicCmd.Motor, QuicMotor.TestSetValue, value)
        .then((p) => {
          this.test.value = p.payload[0];
        });
    },
  },
});
