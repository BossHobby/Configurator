import { QuicCmd, QuicMotor, QuicVal } from "./serial/quic";
import { serial } from "./serial/serial";
import { Log } from "@/log";
import { defineStore } from "pinia";
import { useRootStore } from "./root";
import { useProfileStore } from "./profile";

export const useMotorStore = defineStore("motor", {
  state: () => ({
    loading: false,
    test: {
      active: 0,
      value: new Array<number>(),
    },
    settings: null as any,
    _pins: [
      {
        index: 1,
        id: "MOTOR_FL",
        label: "Front Left",
      },
      {
        index: 3,
        id: "MOTOR_FR",
        label: "Front Right",
      },
      {
        index: 0,
        id: "MOTOR_BL",
        label: "Back Left",
      },
      {
        index: 2,
        id: "MOTOR_BR",
        label: "Back Right",
      },
    ],
  }),
  getters: {
    pins(state) {
      const profile = useProfileStore();
      return state._pins.map((p) => {
        return {
          ...p,
          pin: profile.motor.motor_pins[p.index],
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
    motor_test_toggle() {
      return serial
        .command(
          QuicCmd.Motor,
          this.test.active ? QuicMotor.TestDisable : QuicMotor.TestEnable
        )
        .then(() => {
          this.test.active = this.test.active ? 0 : 1;
        });
    },
    motor_test_set_value(value) {
      return serial
        .command(QuicCmd.Motor, QuicMotor.TestSetValue, value)
        .then(() => {
          this.test.value = value;
        });
    },
  },
});
