import { defineStore } from "pinia";
import { useRootStore } from "./root";
import { QuicBlackbox, QuicCmd } from "./serial/quic";
import { serial } from "./serial/serial";
import { Blackbox } from "./util/blackbox";
import { BlackboxField } from "./constants";

export enum BlackboxFieldUnit {
  NONE = "none",
  US = "us",
  RADIANS = "rad",
}

export interface BlackboxFieldDef {
  name: string;
  title: string;
  scale: number;
  axis?: string[];
  unit: BlackboxFieldUnit;
}

const AxisRPY = ["Roll", "Pitch", "Yaw"];
const AxisRPYT = [...AxisRPY, "Throttle"];
const AxisIndex = (count) =>
  Array.from(Array(count).keys()).map((i) => i.toString());

export const BlackboxFields: { [index: number]: BlackboxFieldDef } = {
  [BlackboxField.LOOP]: {
    name: "loop",
    title: "Loop",
    scale: 1,
    unit: BlackboxFieldUnit.NONE,
  },
  [BlackboxField.TIME]: {
    name: "time",
    title: "Time",
    scale: 1,
    unit: BlackboxFieldUnit.US,
  },
  [BlackboxField.PID_P_TERM]: {
    name: "pid_pterm",
    title: "PID P-Term",
    axis: AxisRPY,
    scale: 1000,
    unit: BlackboxFieldUnit.NONE,
  },
  [BlackboxField.PID_I_TERM]: {
    name: "pid_iterm",
    title: "PID I-Term",
    axis: AxisRPY,
    scale: 1000,
    unit: BlackboxFieldUnit.NONE,
  },
  [BlackboxField.PID_D_TERM]: {
    name: "pid_dterm",
    title: "PID D-Term",
    axis: AxisRPY,
    scale: 1000,
    unit: BlackboxFieldUnit.NONE,
  },
  [BlackboxField.RX]: {
    name: "rx",
    title: "RX",
    axis: AxisRPYT,
    scale: 1000,
    unit: BlackboxFieldUnit.NONE,
  },
  [BlackboxField.SETPOINT]: {
    name: "setpoint",
    title: "Setpoint",
    axis: AxisRPYT,
    scale: 1000,
    unit: BlackboxFieldUnit.NONE,
  },
  [BlackboxField.ACCEL_RAW]: {
    name: "accel_raw",
    title: "Accel Raw",
    axis: AxisRPY,
    scale: 1000,
    unit: BlackboxFieldUnit.RADIANS,
  },
  [BlackboxField.ACCEL_FILTER]: {
    name: "accel_filter",
    title: "Accel Filter",
    axis: AxisRPY,
    scale: 1000,
    unit: BlackboxFieldUnit.RADIANS,
  },
  [BlackboxField.GYRO_RAW]: {
    name: "gyro_raw",
    title: "Gyro Raw",
    axis: AxisRPY,
    scale: 1000,
    unit: BlackboxFieldUnit.RADIANS,
  },
  [BlackboxField.GYRO_FILTER]: {
    name: "gyro_filter",
    title: "Gyro Filter",
    axis: AxisRPY,
    scale: 1000,
    unit: BlackboxFieldUnit.RADIANS,
  },
  [BlackboxField.MOTOR]: {
    name: "motor",
    title: "Motor",
    axis: AxisIndex(4),
    scale: 1000,
    unit: BlackboxFieldUnit.NONE,
  },
  [BlackboxField.CPU_LOAD]: {
    name: "cpu_load",
    title: "CPU Load",
    scale: 1,
    unit: BlackboxFieldUnit.US,
  },
  [BlackboxField.DEBUG]: {
    name: "debug",
    title: "Debug",
    axis: AxisIndex(4),
    scale: 1,
    unit: BlackboxFieldUnit.NONE,
  },
};

export const useBlackboxStore = defineStore("blackbox", {
  state: () => ({
    busy: false,
    speed: undefined as number | undefined,
    progress: undefined as number | undefined,
    list: { flash_size: 0, files: [] as { size: number }[] },
  }),
  actions: {
    reset_blackbox() {
      const root = useRootStore();

      return serial
        .command(QuicCmd.Blackbox, QuicBlackbox.Reset)
        .then(() => {
          root.append_alert({
            type: "success",
            msg: "Blackbox successfully reset",
          });
        })
        .catch((err) => {
          root.append_alert({ type: "danger", msg: err });
        });
    },
    list_blackbox() {
      return serial
        .command(QuicCmd.Blackbox, QuicBlackbox.List)
        .then((p) => (this.list = p.payload[0]));
    },
    download_blackbox_quic(index) {
      const root = useRootStore();
      const file = this.list.files[index];

      const start = performance.now();
      return serial
        .commandProgress(
          QuicCmd.Blackbox,
          (v: number) => {
            const delta = (performance.now() - start) / 1000;
            this.progress = v / file.size;
            this.speed = v / delta;
          },
          QuicBlackbox.Get,
          index
        )
        .then((p) => {
          const f = {
            ...file,
            fields: Object.keys(BlackboxFields).map((i) => BlackboxFields[i]),
            entries: p.payload,
          };

          const encoded = encodeURIComponent(JSON.stringify(f));
          return "data:text/json;charset=utf-8," + encoded;
        })
        .then((url) => {
          root.append_alert({
            type: "success",
            msg: "Blackbox successfully downloaded!",
          });
          return url;
        })
        .catch((err) => {
          root.append_alert({
            type: "danger",
            msg: "Blackbox download failed",
          });
          throw err;
        })
        .finally(() => {
          this.progress = undefined;
          this.speed = undefined;
        });
    },
    download_blackbox_btfl(index) {
      const root = useRootStore();
      const file = this.list.files[index];

      const start = performance.now();
      return serial
        .commandProgress(
          QuicCmd.Blackbox,
          (v: number) => {
            const delta = (performance.now() - start) / 1000;
            this.progress = v / file.size;
            this.speed = v / delta;
          },
          QuicBlackbox.Get,
          index
        )
        .then((p) => {
          const writer = new Blackbox(file);
          writer.writeHeaders();
          for (const v of p.payload) {
            writer.writeValue(v);
          }
          return writer.toUrl();
        })
        .then((url) => {
          root.append_alert({
            type: "success",
            msg: "Blackbox successfully downloaded!",
          });
          return url;
        })
        .catch((err) => {
          root.append_alert({
            type: "danger",
            msg: "Blackbox download failed",
          });
          throw err;
        })
        .finally(() => {
          this.progress = undefined;
          this.speed = undefined;
        });
    },
  },
});
