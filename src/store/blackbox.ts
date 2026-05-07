import { defineStore } from "pinia";
import { useRootStore } from "./root";
import { QuicBlackbox, QuicCmd, QuicVal } from "./serial/quic";
import { serial } from "./serial/serial";
import {
  BLACKBOX_SCALE,
  blackboxScaleForFirmware,
  transformBlackboxFieldFlags,
  type BlackboxFile,
} from "./util/blackbox-shared";
import { BlackboxField } from "./constants";
import { useProfileStore } from "./profile";
import { useInfoStore } from "./info";
import type { profile_t } from "./types";

type BlackboxWorkerFormat = "json" | "btfl";

let blackboxWorkerRequestId = 0;

function processBlackboxInWorker(
  format: BlackboxWorkerFormat,
  payload: Uint8Array,
  file: BlackboxFile,
  firmwareVersion: string,
  fields?: BlackboxFieldDef[],
  profile?: profile_t,
) {
  return new Promise<string>((resolve, reject) => {
    const worker = new Worker(
      new URL("./blackbox.worker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    const id = ++blackboxWorkerRequestId;

    worker.onmessage = (event) => {
      if (event.data.id != id) {
        return;
      }
      worker.terminate();

      if (event.data.error) {
        reject(new Error(event.data.error));
        return;
      }

      resolve(URL.createObjectURL(event.data.blob));
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(event.error ?? new Error(event.message));
    };

    const buffer = payload.buffer.slice(
      payload.byteOffset,
      payload.byteOffset + payload.byteLength,
    );
    const cloneableFile = { ...file };
    const cloneableFields = fields?.map((field) => ({
      ...field,
      axis: field.axis ? [...field.axis] : undefined,
    }));
    const cloneableProfile = profile
      ? (JSON.parse(JSON.stringify(profile)) as profile_t)
      : undefined;

    worker.postMessage(
      {
        id,
        format,
        payload: buffer,
        file: cloneableFile,
        firmwareVersion,
        fields: cloneableFields,
        profile: cloneableProfile,
      },
      [buffer],
    );
  });
}

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

export interface BlackboxPreset {
  field_flags: number;
  name: string;
  name_osd: string;
  sample_rate_hz: number;
}

export type { BlackboxFile } from "./util/blackbox-shared";
export { transformBlackboxFieldFlags } from "./util/blackbox-shared";

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
    scale: BLACKBOX_SCALE,
    unit: BlackboxFieldUnit.NONE,
  },
  [BlackboxField.PID_I_TERM]: {
    name: "pid_iterm",
    title: "PID I-Term",
    axis: AxisRPY,
    scale: BLACKBOX_SCALE,
    unit: BlackboxFieldUnit.NONE,
  },
  [BlackboxField.PID_D_TERM]: {
    name: "pid_dterm",
    title: "PID D-Term",
    axis: AxisRPY,
    scale: BLACKBOX_SCALE,
    unit: BlackboxFieldUnit.NONE,
  },
  [BlackboxField.RX]: {
    name: "rx",
    title: "RX",
    axis: AxisRPYT,
    scale: BLACKBOX_SCALE,
    unit: BlackboxFieldUnit.NONE,
  },
  [BlackboxField.SETPOINT]: {
    name: "setpoint",
    title: "Setpoint",
    axis: AxisRPYT,
    scale: BLACKBOX_SCALE,
    unit: BlackboxFieldUnit.RADIANS,
  },
  [BlackboxField.ACCEL_RAW]: {
    name: "accel_raw",
    title: "Accel Raw",
    axis: AxisRPY,
    scale: BLACKBOX_SCALE,
    unit: BlackboxFieldUnit.RADIANS,
  },
  [BlackboxField.ACCEL_FILTER]: {
    name: "accel_filter",
    title: "Accel Filter",
    axis: AxisRPY,
    scale: BLACKBOX_SCALE,
    unit: BlackboxFieldUnit.RADIANS,
  },
  [BlackboxField.GYRO_RAW]: {
    name: "gyro_raw",
    title: "Gyro Raw",
    axis: AxisRPY,
    scale: BLACKBOX_SCALE,
    unit: BlackboxFieldUnit.RADIANS,
  },
  [BlackboxField.GYRO_FILTER]: {
    name: "gyro_filter",
    title: "Gyro Filter",
    axis: AxisRPY,
    scale: BLACKBOX_SCALE,
    unit: BlackboxFieldUnit.RADIANS,
  },
  [BlackboxField.MOTOR]: {
    name: "motor",
    title: "Motor",
    axis: AxisIndex(4),
    scale: BLACKBOX_SCALE,
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
    axis: AxisIndex(10),
    scale: 1,
    unit: BlackboxFieldUnit.NONE,
  },
};

export const useBlackboxStore = defineStore("blackbox", {
  state: () => ({
    busy: false,
    speed: undefined as number | undefined,
    progress: undefined as number | undefined,
    list: { flash_size: 0, files: [] as BlackboxFile[] },
    presets: [] as BlackboxPreset[],
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
    fetch_presets() {
      return serial
        .get(QuicVal.BlackboxPresets)
        .then((val) => (this.presets = val));
    },
    download_blackbox_quic(index) {
      const root = useRootStore();
      const file = this.list.files[index];
      const fieldflags = transformBlackboxFieldFlags(file.field_flags);
      const info = useInfoStore();

      const start = performance.now();
      return serial
        .commandProgressRaw(
          QuicCmd.Blackbox,
          (v: number) => {
            const delta = (performance.now() - start) / 1000;
            this.progress = v / file.size;
            this.speed = v / delta;
          },
          QuicBlackbox.Get,
          index,
        )
        .then((p) => {
          const fields = Object.keys(BlackboxFields)
            .filter((_val, key) => {
              return (fieldflags & (1 << key)) > 0;
            })
            .map((i) => ({
              ...BlackboxFields[i],
              scale:
                BlackboxFields[i].scale == BLACKBOX_SCALE
                  ? blackboxScaleForFirmware(info.quic_protocol_semver)
                  : BlackboxFields[i].scale,
            }));

          return processBlackboxInWorker(
            "json",
            p.payload,
            file,
            info.quic_protocol_semver,
            fields,
          );
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
      const info = useInfoStore();

      const start = performance.now();
      return serial
        .commandProgressRaw(
          QuicCmd.Blackbox,
          (v: number) => {
            const delta = (performance.now() - start) / 1000;
            this.progress = v / file.size;
            this.speed = v / delta;
          },
          QuicBlackbox.Get,
          index,
        )
        .then((p) => {
          const profile = useProfileStore();

          return processBlackboxInWorker(
            "btfl",
            p.payload,
            file,
            info.quic_protocol_semver,
            undefined,
            JSON.parse(JSON.stringify(profile)) as profile_t,
          );
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
