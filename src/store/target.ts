import { QuicVal } from "./serial/quic";
import { serial } from "./serial/serial";
import { defineStore } from "pinia";
import type { target_t } from "./types";

import YAML from "yaml";
import { useInfoStore } from "./info";
import { useRootStore } from "./root";

export function skipEmpty(val: any) {
  if (val === undefined) {
    return undefined;
  }
  if (val === "NONE") {
    return undefined;
  }
  if (Array.isArray(val)) {
    for (let i = val.length - 1; i >= 0; i--) {
      val[i] = skipEmpty(val[i]);
      if (!val[i]) {
        val.splice(i, 1);
      }
    }
    if (val.length == 0) {
      return undefined;
    }
  }
  if (Object.getPrototypeOf(val) === Object.prototype) {
    const keys = Object.keys(val);
    for (let i = keys.length - 1; i >= 0; i--) {
      val[keys[i]] = skipEmpty(val[keys[i]]);
      if (!val[keys[i]]) {
        delete val[keys[i]];
      }
    }
    if (Object.keys(val).length == 0) {
      return undefined;
    }
  }
  return val;
}

export const useTargetStore = defineStore("target", {
  state: (): target_t => ({
    name: "",

    brushless: true,

    gyro_orientation: 0,

    leds: [],
    serial_ports: [],
    serial_soft_ports: [],
    spi_ports: [],

    motor_pins: [],
  }),
  getters: {
    yaml(store) {
      const info = useInfoStore();
      return YAML.stringify(
        skipEmpty({ mcu: info.mcu, ...(store as any).$state })
      );
    },
    serial_port_names(store): { [index: string]: number } {
      const res = {};

      const info = useInfoStore();
      if (info.quicVersionGte("0.2.0")) {
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
      if (info.quicVersionGte("0.2.0")) {
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
    apply(target: target_t) {
      const root = useRootStore();
      return serial
        .set(QuicVal.Target, target)
        .then(() => this.fetch())
        .then(() =>
          root.append_alert({ type: "success", msg: "Target applied!" })
        );
    },
  },
});
