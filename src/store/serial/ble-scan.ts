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

export async function scanForDevice(
  client: typeof BleClient,
  service: string,
): Promise<string> {
  settle?.();
  const chosen = new Promise<string | undefined>((resolve) => {
    settle = resolve;
  });
  bleScan.devices = [];
  bleScan.selected = undefined;
  bleScan.scanning = true;
  try {
    // Duplicates keep the signal strength current while the list is open.
    await client.requestLEScan(
      { services: [service], allowDuplicates: true },
      (result) => {
        const name = result.localName || result.device.name || "Unnamed device";
        // Keep first-seen order so rows do not move under the user's finger.
        const known = bleScan.devices.find(
          (d) => d.deviceId === result.device.deviceId,
        );
        if (known) Object.assign(known, { name, rssi: result.rssi });
        else
          bleScan.devices.push({
            deviceId: result.device.deviceId,
            name,
            rssi: result.rssi,
          });
      },
    );
    const deviceId = await chosen;
    if (!deviceId) throw new ScanCancelled();
    bleScan.selected = deviceId;
    return deviceId;
  } finally {
    settle = undefined;
    bleScan.scanning = false;
    await client.stopLEScan().catch(() => {});
  }
}

export function chooseDevice(deviceId: string) {
  settle?.(deviceId);
}

export function cancelScan() {
  settle?.();
}
