import type { CrsfTransport } from "./crsf";

// The TBS Crossfire Wi-Fi module's Bluetooth "Serial" mode exposes the Nordic
// UART service. A first write that does not start with '$' (MSP) selects its
// raw CRSF bridge, the same stream as the /ws WebSocket.
//
// The module, TBS Agent and Betaflight Configurator write ...0003 and
// subscribe to ...0002, the reverse of Nordic's own layout. Keep it that way:
// it is what the module serves. Bridges with Nordic's layout still work, as
// the characteristics are picked by their properties.
const UART_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const UART_NOTIFY = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const UART_WRITE = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

interface Characteristic {
  uuid: string;
  properties: {
    write: boolean;
    writeWithoutResponse: boolean;
    notify: boolean;
    indicate: boolean;
  };
}

/** Picks the write and notify characteristics, preferring the module's. */
export function resolveEndpoints<T extends Characteristic>(
  characteristics: T[],
): { write: T; notify: T } {
  const pick = (preferred: string, usable: (c: T) => boolean) =>
    characteristics.find((c) => c.uuid == preferred && usable(c)) ??
    characteristics.find(usable);
  const write = pick(
    UART_WRITE,
    (c) => c.properties.write || c.properties.writeWithoutResponse,
  );
  const notify = pick(
    UART_NOTIFY,
    (c) => c.properties.notify || c.properties.indicate,
  );
  if (!write || !notify) {
    throw new Error("Bluetooth device has no usable UART characteristics");
  }
  return { write, notify };
}

// Reconnects, e.g. after a reboot, reuse the chosen device without a picker.
let device: BluetoothDevice | undefined;

export function bleSupported() {
  return typeof navigator !== "undefined" && !!navigator.bluetooth;
}

/** Shows the browser's device picker; needs a user gesture. */
export async function requestBleDevice() {
  // The module only advertises the UART service in its "Serial" mode.
  device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [UART_SERVICE] }],
  });
}

export class CrsfBluetooth implements CrsfTransport {
  private device?: BluetoothDevice;
  private notify?: BluetoothRemoteGATTCharacteristic;
  private write?: BluetoothRemoteGATTCharacteristic;
  // GATT operations must not overlap.
  private writes: Promise<unknown> = Promise.resolve();
  private onValue?: () => void;
  private onDisconnect?: () => void;

  async open(
    onData: (chunk: Uint8Array) => void,
    onClose: (err: any) => void,
  ): Promise<void> {
    if (!device?.gatt) throw new Error("no Bluetooth device selected");
    this.device = device;
    this.onDisconnect = () => {
      this.detach();
      onClose(new Error("Bluetooth device disconnected"));
    };
    device.addEventListener("gattserverdisconnected", this.onDisconnect);

    try {
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(UART_SERVICE);
      const { write, notify } = resolveEndpoints(
        await service.getCharacteristics(),
      );
      this.write = write;
      this.notify = notify;
      this.onValue = () => {
        const value = notify.value;
        if (value) {
          onData(
            new Uint8Array(value.buffer, value.byteOffset, value.byteLength),
          );
        }
      };
      notify.addEventListener("characteristicvaluechanged", this.onValue);
      // Subscribing opens the module's session.
      await notify.startNotifications();
    } catch (err) {
      this.close();
      throw err;
    }
  }

  // A CRSF frame of at most 64 bytes fits the MTU the module negotiates. The
  // module also accepts writes with response, which fall back to a long write
  // on a smaller MTU.
  send(frame: Uint8Array<ArrayBuffer>) {
    const write = this.write;
    if (!write) return;
    const withResponse = () => write.writeValueWithResponse(frame);
    this.writes = this.writes
      .then(() =>
        write.properties.writeWithoutResponse
          ? write.writeValueWithoutResponse(frame).catch(withResponse)
          : withResponse(),
      )
      .catch(() => {
        /* The QUIC session retransmits lost frames. */
      });
  }

  close() {
    const gatt = this.device?.gatt;
    this.detach();
    if (gatt?.connected) gatt.disconnect();
  }

  private detach() {
    if (this.onDisconnect) {
      this.device?.removeEventListener(
        "gattserverdisconnected",
        this.onDisconnect,
      );
    }
    if (this.onValue) {
      this.notify?.removeEventListener(
        "characteristicvaluechanged",
        this.onValue,
      );
    }
    this.device = undefined;
    this.notify = undefined;
    this.write = undefined;
    this.onValue = undefined;
    this.onDisconnect = undefined;
  }
}
