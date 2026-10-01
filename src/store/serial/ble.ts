import {
  BleClient,
  type BleCharacteristic,
} from "@capacitor-community/bluetooth-le";
import { Capacitor } from "@capacitor/core";
import { Log } from "@/log";
import { cancelScan, scanForDevice } from "./ble-scan";
import type { ByteTransport } from "./transport";

export interface BleSettings {
  service: string;
  writeCharacteristic: string;
  notifyCharacteristic: string;
}

// Nordic UART UUIDs are a starting profile, not a claim about device support.
export const defaultBleSettings: BleSettings = {
  service: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  writeCharacteristic: "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
  notifyCharacteristic: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
};

export function bleSupported() {
  return Capacitor.isNativePlatform() || "bluetooth" in navigator;
}

export function validateBleSettings(settings: BleSettings) {
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!Object.values(settings).every((value) => uuid.test(value))) {
    throw new Error(
      "Enter full 128-bit Bluetooth service and characteristic UUIDs",
    );
  }
}

export type DeviceChooser = (
  client: typeof BleClient,
  service: string,
) => Promise<string>;

// Native builds list devices in the app; browsers must use their own picker.
const defaultChooser: DeviceChooser = (client, service) =>
  Capacitor.isNativePlatform()
    ? scanForDevice(client, service)
    : client
        .requestDevice({ services: [service] })
        .then((device) => device.deviceId);

interface Endpoints {
  notify: string;
  write: string;
  withResponse: boolean;
}

/**
 * Picks the notify and write characteristics from the service. Bridges do not
 * all follow the Nordic UART layout (TBS Crossfire rejects notifications on
 * 6e400003), so the configured UUIDs are only a preference.
 */
export function resolveEndpoints(
  settings: BleSettings,
  characteristics: BleCharacteristic[],
): Endpoints {
  const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  const pick = (preferred: string, usable: (c: BleCharacteristic) => boolean) =>
    characteristics.find((c) => same(c.uuid, preferred) && usable(c)) ??
    characteristics.find(usable);
  const notify = pick(
    settings.notifyCharacteristic,
    (c) => c.properties.notify || c.properties.indicate,
  );
  const write = pick(
    settings.writeCharacteristic,
    (c) => c.properties.write || c.properties.writeWithoutResponse,
  );
  if (!notify || !write)
    throw new Error("Bluetooth device has no usable data characteristics");
  return {
    notify: notify.uuid,
    write: write.uuid,
    withResponse: write.properties.write,
  };
}

export class BleTransport implements ByteTransport {
  private deviceId?: string;
  private endpoints?: Endpoints;
  private connected = false;
  private generation = 0;
  private writes: Promise<void> = Promise.resolve();
  constructor(
    private settings: BleSettings,
    private client = BleClient,
    private choose = defaultChooser,
  ) {}

  async connect(
    onData: (data: Uint8Array) => void,
    onClose: (error: unknown) => void,
  ) {
    validateBleSettings(this.settings);
    const generation = ++this.generation;
    const check = () => {
      if (generation !== this.generation)
        throw new Error("Bluetooth connection cancelled");
    };
    await this.client.initialize({ androidNeverForLocation: true });
    check();
    if (!this.deviceId) {
      const deviceId = await this.choose(this.client, this.settings.service);
      check();
      this.deviceId = deviceId;
    }
    const id = this.deviceId;
    try {
      await this.client.connect(id, () => {
        if (generation !== this.generation) return;
        this.connected = false;
        onClose(new Error("Bluetooth device disconnected"));
      });
      check();
      this.connected = true;
      this.writes = Promise.resolve();
      const service = (await this.client.getServices(id)).find(
        (s) => s.uuid.toLowerCase() === this.settings.service.toLowerCase(),
      );
      check();
      if (!service)
        throw new Error("Bluetooth device does not offer the bridge service");
      Log.info(
        "ble",
        service.characteristics
          .map(
            (c) =>
              `${c.uuid} [${Object.entries(c.properties)
                .filter(([, on]) => on)
                .map(([name]) => name)
                .join(",")}]`,
          )
          .join(" "),
      );
      const endpoints = resolveEndpoints(
        this.settings,
        service.characteristics,
      );
      this.endpoints = endpoints;
      await this.client.startNotifications(
        id,
        this.settings.service,
        endpoints.notify,
        (value) => {
          if (generation === this.generation && this.connected) {
            onData(
              new Uint8Array(
                value.buffer,
                value.byteOffset,
                value.byteLength,
              ).slice(),
            );
          }
        },
      );
      check();
      if (!this.connected) throw new Error("Bluetooth device disconnected");
    } catch (error) {
      await this.close();
      throw error;
    }
  }

  write(data: Uint8Array): Promise<void> {
    const generation = this.generation;
    const bytes = data.slice();
    // Acknowledged writes and conservative 20-byte payloads work at ATT MTU 23.
    // Do not assume a larger MTU or enqueue concurrent GATT operations.
    return (this.writes = this.writes.then(async () => {
      for (let offset = 0; offset < bytes.length; offset += 20) {
        const endpoints = this.endpoints;
        if (
          !this.connected ||
          generation !== this.generation ||
          !this.deviceId ||
          !endpoints
        ) {
          throw new Error("Bluetooth is disconnected");
        }
        const chunk = bytes.slice(offset, offset + 20);
        await (
          endpoints.withResponse
            ? this.client.write
            : this.client.writeWithoutResponse
        ).call(
          this.client,
          this.deviceId,
          this.settings.service,
          endpoints.write,
          new DataView(chunk.buffer),
        );
      }
    }));
  }

  async close() {
    ++this.generation;
    cancelScan();
    this.connected = false;
    const endpoints = this.endpoints;
    this.endpoints = undefined;
    if (this.deviceId) {
      if (endpoints)
        await this.client
          .stopNotifications(
            this.deviceId,
            this.settings.service,
            endpoints.notify,
          )
          .catch(() => {});
      await this.client.disconnect(this.deviceId).catch(() => {});
    }
  }
}
