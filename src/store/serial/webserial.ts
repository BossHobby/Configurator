import { serial } from "web-serial-polyfill";

export function getWebSerial() {
  if (navigator.serial) {
    return navigator.serial;
  }
  return serial;
}
