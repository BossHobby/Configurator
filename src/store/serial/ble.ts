import { Capacitor } from "@capacitor/core";
import type { CrsfTransport } from "./crsf";
import { CrsfNativeBluetooth, requestNativeBleDevice } from "./ble-native";
import { listDevice, pickDevice } from "./ble-scan";
import { UART_SERVICE, resolveEndpoints } from "../util/ble";

// Reconnects, e.g. after a reboot, reuse the chosen device without a picker.
let device: BluetoothDevice | undefined;

const native = Capacitor.isNativePlatform();

export function bleSupported() {
  return native || (typeof navigator !== "undefined" && !!navigator.bluetooth);
}

/** The Bluetooth bridge transport of this platform. */
export function bluetoothTransport(): CrsfTransport {
  return native ? new CrsfNativeBluetooth() : new CrsfBluetooth();
}

/** Lets the user choose a module; in browsers this needs a user gesture. */
export async function requestBleDevice() {
  if (native) return requestNativeBleDevice();
  // The module only advertises the UART service in its "Serial" mode.
  const request = navigator.bluetooth.requestDevice({
    filters: [{ services: [UART_SERVICE] }],
  });
  if (window.electron) await pickInElectron();
  device = await request;
}

// Electron has no chooser of its own: the main process forwards what it
// finds to the in-app device list and waits for the pick.
async function pickInElectron() {
  const ipc = window.electron.ipcRenderer;
  ipc.on("bluetooth-devices", (_event, devices) => {
    for (const d of devices as { deviceId: string; deviceName: string }[]) {
      listDevice({
        deviceId: d.deviceId,
        name: d.deviceName || "Unnamed device",
      });
    }
  });
  let picked = "";
  try {
    picked = await pickDevice(
      async () => {},
      async () => {},
    );
  } finally {
    ipc.removeAllListeners("bluetooth-devices");
    // An empty id cancels the request.
    ipc.send("bluetooth-device", picked);
  }
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
