import { BleClient } from "@capacitor-community/bluetooth-le";
import type { CrsfTransport } from "./crsf";
import { cancelScan, scanForDevice } from "./ble-scan";
import { UART_SERVICE, resolveEndpoints } from "../util/ble";

// Reconnects, e.g. after a reboot, reuse the chosen device without a scan.
let deviceId: string | undefined;

/** Lists nearby modules in the app until one is chosen. */
export async function requestNativeBleDevice() {
  await BleClient.initialize({ androidNeverForLocation: true });
  deviceId = await scanForDevice(BleClient, UART_SERVICE);
}

/** The Bluetooth bridge in the iOS and Android apps. */
export class CrsfNativeBluetooth implements CrsfTransport {
  private id?: string;
  private notify?: string;
  private write?: string;
  private withoutResponse = false;
  // Android requests a 512 byte MTU on connect; iOS negotiates its own.
  private chunk = 20;
  // GATT operations must not overlap.
  private writes: Promise<unknown> = Promise.resolve();

  async open(
    onData: (chunk: Uint8Array) => void,
    onClose: (err: any) => void,
  ): Promise<void> {
    const id = deviceId;
    if (!id) throw new Error("no Bluetooth device selected");
    this.id = id;

    try {
      await BleClient.connect(id, () => {
        if (this.id !== id) return;
        this.detach();
        onClose(new Error("Bluetooth device disconnected"));
      });
      const service = (await BleClient.getServices(id)).find(
        (s) => s.uuid.toLowerCase() == UART_SERVICE,
      );
      if (!service) throw new Error("Bluetooth device has no UART service");
      const { write, notify } = resolveEndpoints(service.characteristics);
      this.write = write.uuid;
      this.notify = notify.uuid;
      this.withoutResponse = write.properties.writeWithoutResponse;
      this.chunk = Math.max(20, (await BleClient.getMtu(id)) - 3);
      // Subscribing opens the module's session.
      await BleClient.startNotifications(id, UART_SERVICE, notify.uuid, (v) =>
        onData(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)),
      );
    } catch (err) {
      this.close();
      throw err;
    }
  }

  send(frame: Uint8Array<ArrayBuffer>) {
    const id = this.id;
    const write = this.write;
    if (!id || !write) return;
    this.writes = this.writes
      .then(async () => {
        for (let offset = 0; offset < frame.length; offset += this.chunk) {
          const chunk = frame.slice(offset, offset + this.chunk);
          const value = new DataView(chunk.buffer);
          if (this.withoutResponse) {
            await BleClient.writeWithoutResponse(
              id,
              UART_SERVICE,
              write,
              value,
            );
          } else {
            await BleClient.write(id, UART_SERVICE, write, value);
          }
        }
      })
      .catch(() => {
        /* The QUIC session retransmits lost frames. */
      });
  }

  close() {
    cancelScan();
    const id = this.id;
    const notify = this.notify;
    this.detach();
    if (!id) return;
    const stop = notify
      ? BleClient.stopNotifications(id, UART_SERVICE, notify)
      : Promise.resolve();
    stop
      .catch(() => {})
      .then(() => BleClient.disconnect(id))
      .catch(() => {});
  }

  private detach() {
    this.id = undefined;
    this.notify = undefined;
    this.write = undefined;
  }
}
