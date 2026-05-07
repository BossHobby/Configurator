import semver from "semver";
import { BlackboxField } from "../constants";

export const LEGACY_BLACKBOX_SCALE = 1000;
export const BLACKBOX_SCALE = 100;

export interface BlackboxFile {
  field_flags: number;
  looptime: number;
  blackbox_rate: number;
  start: number;
  size: number;
}

export function transformBlackboxFieldFlags(flags: number) {
  // Quicksilver versions 0.96 and below don't provide the field flags.
  const res = flags == undefined ? -1 : flags;
  return res | (1 << BlackboxField.LOOP) | (1 << BlackboxField.TIME);
}

export function blackboxScaleForFirmware(firmwareVersion: string) {
  return semver.gte(firmwareVersion, "0.2.7")
    ? BLACKBOX_SCALE
    : LEGACY_BLACKBOX_SCALE;
}
