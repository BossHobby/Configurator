import { Capacitor } from "@capacitor/core";
import { defaultBleSettings, type BleSettings } from "./ble";

export type ConnectionKind = "usb" | "websocket" | "crsf" | "ble" | "ble-crsf";
export interface ConnectionOptions {
  kind: ConnectionKind;
  url: string;
  ble: BleSettings;
}

export function initialConnection(): ConnectionOptions {
  const query = new URL(document.location.toString()).searchParams;
  const crsf = query.get("crsf");
  const ws = query.get("ws");
  return {
    kind: crsf
      ? "crsf"
      : ws
        ? "websocket"
        : Capacitor.isNativePlatform()
          ? "ble-crsf"
          : usbSupported()
            ? "usb"
            : "bluetooth" in navigator
              ? "ble"
              : "websocket",
    url: crsf || (ws ? `wss://${ws}/ws` : ""),
    ble: { ...defaultBleSettings },
  };
}

export function usbSupported() {
  return (
    !Capacitor.isNativePlatform() &&
    ("serial" in navigator || "usb" in navigator)
  );
}

export function usbFlashSupported() {
  return !Capacitor.isNativePlatform() && "usb" in navigator;
}
