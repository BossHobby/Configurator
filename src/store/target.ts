import { QuicVal } from "./serial/quic";
import { serial } from "./serial/serial";
import { defineStore } from "pinia";
import type { target_t } from "./types";

import { targetToYaml } from "./util/target-yaml";
import { useInfoStore } from "./info";
import { useRootStore } from "./root";

export const useTargetStore = defineStore("target", {
  state: (): target_t => ({
    name: "",

    gyro_orientation: 0,

    vehicles: 0,

    leds: [],
    pinio: [],
    serial_ports: [],
    serial_soft_ports: [],
    spi_ports: [],

    motor_pins: [],
    outputs: [],
  }),
  getters: {
    yaml(store) {
      const info = useInfoStore();
      return targetToYaml((store as any).$state, info.mcu);
    },
    serial_port_names(store): { [index: string]: number } {
      const res = {};

      const info = useInfoStore();
      if (info.quic_semver_gte("0.2.0")) {
        for (const p of store.serial_ports) {
          if (p.index == 0) {
            continue;
          }

          res[`SERIAL_PORT${p.index}`] = p.index;
        }
        for (const p of store.serial_soft_ports) {
          if (p.index == 0) {
            continue;
          }

          res[`SERIAL_SOFT_PORT${p.index}`] = 100 + p.index;
        }
      } else {
        for (let i = 1; i < info.usart_ports.length; i++) {
          res[info.usart_ports[i]] = i;
        }
      }
      return res;
    },
    motor_pin_names(store): string[] {
      const info = useInfoStore();
      if (store.outputs?.length) {
        return store.outputs.map((output) => output.pin);
      }
      if (info.quic_semver_gte("0.2.0")) {
        return store.motor_pins;
      } else {
        return info.motor_pins;
      }
    },
  },
  actions: {
    fetch() {
      return serial.get(QuicVal.Target).then((target) => this.$patch(target));
    },
    /** The board saves the target and reboots into it; the caller reconnects. */
    apply(target: target_t) {
      const root = useRootStore();
      return serial
        .set(QuicVal.Target, target)
        .then(() => serial.close())
        .then(() =>
          root.append_alert({ type: "success", msg: "Target applied!" }),
        );
    },
  },
});
