import { QuicCmd, QuicMotor, QuicVal } from "./serial/quic";
import { serial } from "./serial/serial";
import { Log } from "@/log";
import { defineStore } from "pinia";
import { useRootStore } from "./root";
import { useProfileStore } from "./profile";
import { output_source_t } from "./types";
import { useInfoStore } from "./info";

const OUTPUT_COUNT = 8;

const MULTI_PINS = [
  {
    index: 0,
    source: output_source_t.OUTPUT_SOURCE_MOTOR_1,
    id: "MOTOR_1",
    label: "Motor 1",
  },
  {
    index: 1,
    source: output_source_t.OUTPUT_SOURCE_MOTOR_2,
    id: "MOTOR_2",
    label: "Motor 2",
  },
  {
    index: 2,
    source: output_source_t.OUTPUT_SOURCE_MOTOR_3,
    id: "MOTOR_3",
    label: "Motor 3",
  },
  {
    index: 3,
    source: output_source_t.OUTPUT_SOURCE_MOTOR_4,
    id: "MOTOR_4",
    label: "Motor 4",
  },
];

const ROVER_PINS = [
  {
    index: 0,
    source: output_source_t.OUTPUT_SOURCE_THROTTLE,
    id: "THROTTLE",
    label: "Throttle",
  },
  {
    index: 3,
    source: output_source_t.OUTPUT_SOURCE_STEERING,
    id: "SERVO",
    label: "Servo",
  },
];

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
      const pins = info.is_rover ? ROVER_PINS : MULTI_PINS;
      return pins.map((p) => {
        const output = profile.outputs.find((o) => o.source === p.source);
        const index = output?.target_output ?? p.index;
        return {
          ...p,
          index,
          pin: index,
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
          if (info.is_rover) {
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
