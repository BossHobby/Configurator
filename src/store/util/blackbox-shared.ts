import semver from "semver";
import { BlackboxField } from "../blackbox-fields";

export const LEGACY_BLACKBOX_SCALE = 1000;
export const BLACKBOX_SCALE = 100;

export interface BlackboxFile {
  field_flags: number;
  looptime: number;
  blackbox_rate: number;
  start: number;
  size: number;
  // UTC seconds at recording start; 0 or missing when the clock was not set.
  datetime?: number;
}

export function blackboxFileDate(file: BlackboxFile): Date | undefined {
  return file.datetime ? new Date(file.datetime * 1000) : undefined;
}

export function transformBlackboxFieldFlags(
  flags: number,
  firmwareVersion?: string,
) {
  // Quicksilver versions 0.96 and below don't provide the field flags.
  let res = flags == undefined ? (1 << 14) - 1 : flags;
  if (
    flags == undefined ||
    (firmwareVersion && semver.lt(firmwareVersion, "0.2.10"))
  ) {
    res = (res & ~(1 << 13)) | (res & (1 << 13) ? 1 << BlackboxField.DEBUG : 0);
  }
  return res | (1 << BlackboxField.LOOP) | (1 << BlackboxField.TIME);
}

export function blackboxScaleForFirmware(firmwareVersion: string) {
  return semver.gte(firmwareVersion, "0.2.7")
    ? BLACKBOX_SCALE
    : LEGACY_BLACKBOX_SCALE;
}

export enum BlackboxFieldUnit {
  NONE = "none",
  US = "us",
  RADIANS = "rad",
  DEGREES = "deg",
  METERS = "m",
  G = "g",
  PERCENT = "percent",
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
    unit: BlackboxFieldUnit.G,
  },
  [BlackboxField.ACCEL_FILTER]: {
    name: "accel_filter",
    title: "Accel Filter",
    axis: AxisRPY,
    scale: BLACKBOX_SCALE,
    unit: BlackboxFieldUnit.G,
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
  [BlackboxField.OUTPUT]: {
    name: "output",
    title: "Output",
    axis: AxisIndex(8),
    scale: BLACKBOX_SCALE,
    unit: BlackboxFieldUnit.NONE,
  },
  [BlackboxField.CPU_LOAD]: {
    name: "cpu_load",
    title: "CPU Load",
    scale: 1,
    unit: BlackboxFieldUnit.PERCENT,
  },
  [BlackboxField.DEBUG]: {
    name: "debug",
    title: "Debug",
    axis: AxisIndex(10),
    scale: 1,
    unit: BlackboxFieldUnit.NONE,
  },
  [BlackboxField.GPS_COORD]: {
    name: "gps_coord",
    title: "GPS Coordinates",
    axis: ["Latitude", "Longitude"],
    scale: 10000000,
    unit: BlackboxFieldUnit.DEGREES,
  },
  [BlackboxField.GPS_HOME]: {
    name: "gps_home",
    title: "Home Coordinates",
    axis: ["Latitude", "Longitude"],
    scale: 10000000,
    unit: BlackboxFieldUnit.DEGREES,
  },
  [BlackboxField.ALTITUDE]: {
    name: "altitude",
    title: "Navigation Altitude",
    scale: 10,
    unit: BlackboxFieldUnit.METERS,
  },
  [BlackboxField.STATE]: {
    name: "state",
    title: "State",
    axis: ["State", "Aux"],
    scale: 1,
    unit: BlackboxFieldUnit.NONE,
  },
};

/** The definitions of the fields a file records, in recording order. */
export function blackboxFieldDefs(
  fieldFlags: number,
  firmwareVersion: string,
): BlackboxFieldDef[] {
  const flags = transformBlackboxFieldFlags(fieldFlags, firmwareVersion);
  return Object.keys(BlackboxFields)
    .filter((_val, key) => (flags & (1 << key)) > 0)
    .map((i) => ({
      ...BlackboxFields[i],
      scale:
        BlackboxFields[i].scale == BLACKBOX_SCALE
          ? blackboxScaleForFirmware(firmwareVersion)
          : BlackboxFields[i].scale,
    }));
}
