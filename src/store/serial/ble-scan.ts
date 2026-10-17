import { reactive } from "vue";
import type { BleClient } from "@capacitor-community/bluetooth-le";

export interface ScannedDevice {
  deviceId: string;
  name: string;
  rssi?: number;
}

/** In-app device list for native builds, replacing the plugin's system picker. */
export const bleScan = reactive({
  scanning: false,
  /** The device being connected after the scan, until the connection settles. */
  selected: undefined as string | undefined,
  devices: [] as ScannedDevice[],
});

/** The user closed the device list; not a connection failure. */
export class ScanCancelled extends Error {
  constructor() {
    super("Bluetooth scan cancelled");
  }
}

let settle: ((deviceId?: string) => void) | undefined;

/** Adds or refreshes a row, keeping first-seen order. */
export function listDevice(device: ScannedDevice) {
  // Rows must not move under the user's finger.
  const known = bleScan.devices.find((d) => d.deviceId === device.deviceId);
  if (known) Object.assign(known, device);
  else bleScan.devices.push(device);
}

/**
 * Shows the device list while `scan` fills it through listDevice() and
 * resolves with the device the user picks.
 */
export async function pickDevice(
  scan: () => Promise<void>,
  stop: () => Promise<void>,
): Promise<string> {
  settle?.();
  const chosen = new Promise<string | undefined>((resolve) => {
    settle = resolve;
  });
  bleScan.devices = [];
  bleScan.selected = undefined;
  bleScan.scanning = true;
  try {
    await scan();
    const deviceId = await chosen;
    if (!deviceId) throw new ScanCancelled();
    bleScan.selected = deviceId;
    return deviceId;
  } finally {
    settle = undefined;
    bleScan.scanning = false;
    await stop().catch(() => {});
  }
}

export function scanForDevice(
  client: typeof BleClient,
  service: string,
): Promise<string> {
  return pickDevice(
    () =>
      // Duplicates keep the signal strength current while the list is open.
      client.requestLEScan(
        { services: [service], allowDuplicates: true },
        (result) =>
          listDevice({
            deviceId: result.device.deviceId,
            name: result.localName || result.device.name || "Unnamed device",
            rssi: result.rssi,
          }),
      ),
    () => client.stopLEScan(),
  );
}

export function chooseDevice(deviceId: string) {
  settle?.(deviceId);
}

export function cancelScan() {
  settle?.();
}
