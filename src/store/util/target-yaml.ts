import YAML from "yaml";
import type { target_t } from "../types";

// The target .yaml export, shared by the target store and the command line
// client.

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

export function targetToYaml(target: target_t, mcu: string): string {
  return YAML.stringify(skipEmpty({ mcu, ...target }));
}

export function targetFilename(target: target_t): string {
  const date = new Date().toISOString().substring(0, 10);
  return `Target_${target.name}_${date}.yaml`;
}
