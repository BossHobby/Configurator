import { serial } from "web-serial-polyfill";

export const WebSerial = navigator.serial ? navigator.serial : serial;
