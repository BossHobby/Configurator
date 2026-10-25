// CDC serial ports over WebUSB, for browsers without Web Serial and for macOS,
// where Web Serial drops input (see webserial.ts). Only the data interface is
// claimed: macOS keeps the communication interface bound to its own driver,
// and the firmware ignores line coding and control line state anyway.

const USB_CLASS_CDC_DATA = 0x0a;

// Large transfers let one request collect a whole reply instead of a packet.
const TRANSFER_SIZE = 4096;

interface DataInterface {
  number: number;
  endpointIn: number;
  endpointOut: number;
}

function findDataInterface(device: USBDevice): DataInterface | undefined {
  for (const iface of device.configurations[0]?.interfaces ?? []) {
    const alternate = iface.alternates[0];
    if (alternate.interfaceClass !== USB_CLASS_CDC_DATA) {
      continue;
    }
    const bulk = (direction: USBDirection) =>
      alternate.endpoints.find(
        (e) => e.type === "bulk" && e.direction === direction,
      );
    const endpointIn = bulk("in");
    const endpointOut = bulk("out");
    if (endpointIn && endpointOut) {
      return {
        number: iface.interfaceNumber,
        endpointIn: endpointIn.endpointNumber,
        endpointOut: endpointOut.endpointNumber,
      };
    }
  }
  return undefined;
}

class UsbSerialPort {
  public readable: ReadableStream<Uint8Array> | null = null;
  public writable: WritableStream<Uint8Array> | null = null;

  constructor(
    private device: USBDevice,
    private data: DataInterface,
  ) {}

  public async open(_options: SerialOptions) {
    await this.device.open();
    try {
      if (this.device.configuration === null) {
        await this.device.selectConfiguration(1);
      }
      await this.device.claimInterface(this.data.number);
    } catch (err) {
      await this.device.close();
      throw err;
    }

    const { device, data } = this;
    // A single outstanding transfer: while the reader is behind, the device is
    // NAKed rather than its data dropped.
    this.readable = new ReadableStream<Uint8Array>({
      async pull(controller) {
        // A zero-length packet, sent after a reply filling whole packets,
        // ends a transfer without data. pull() must not return without
        // enqueuing, or the stream never calls it again.
        while (true) {
          const result = await device.transferIn(
            data.endpointIn,
            TRANSFER_SIZE,
          );
          if (result.status !== "ok") {
            throw new Error(`USB transfer in: ${result.status}`);
          }
          if (result.data?.byteLength) {
            controller.enqueue(
              new Uint8Array(
                result.data.buffer,
                result.data.byteOffset,
                result.data.byteLength,
              ),
            );
            return;
          }
        }
      },
    });
    this.writable = new WritableStream<Uint8Array>({
      async write(chunk) {
        const result = await device.transferOut(data.endpointOut, chunk);
        if (result.status !== "ok") {
          throw new Error(`USB transfer out: ${result.status}`);
        }
      },
    });
  }

  public async close() {
    // Closing the device also aborts a pending transfer of the cancelled reader.
    this.readable = null;
    this.writable = null;
    if (this.device.opened) {
      await this.device.close();
    }
  }
}

// Serial consumers only use the members implemented above.
function toSerialPort(device: USBDevice): SerialPort | undefined {
  const data = findDataInterface(device);
  return data
    ? (new UsbSerialPort(device, data) as unknown as SerialPort)
    : undefined;
}

export const usbSerial = {
  async requestPort(options?: SerialPortRequestOptions): Promise<SerialPort> {
    const filters = (options?.filters ?? []).map((f) => ({
      vendorId: f.usbVendorId,
      productId: f.usbProductId,
    }));
    const device = await navigator.usb.requestDevice({ filters });
    const port = toSerialPort(device);
    if (!port) {
      throw new Error("device has no CDC data interface");
    }
    return port;
  },

  async getPorts(): Promise<SerialPort[]> {
    // Devices without a data interface, such as DFU, are not serial ports.
    const devices = await navigator.usb.getDevices();
    return devices
      .map(toSerialPort)
      .filter((port): port is SerialPort => port !== undefined);
  },
};
