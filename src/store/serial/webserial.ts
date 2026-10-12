import { usbSerial } from "./usbserial";

// Chrome opens macOS serial ports with PARMRK, which limits the tty input
// queue to about 1 KB and silently drops bytes while the reader lags. Over
// WebUSB the device is NAKed instead, so large replies stay intact.
const isMacOS = /Mac/.test(navigator.platform);

export const WebSerial =
  navigator.serial && !isMacOS ? navigator.serial : usbSerial;
