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
