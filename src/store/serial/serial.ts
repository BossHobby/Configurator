import { QuicCmd, QuicFlag, QuicHeader, QuicPacket, QuicVal, QUIC_HEADER_LEN, QUIC_MAGIC } from './quic';
import { Encoder, FLOAT32_OPTIONS } from 'cbor-x/encode';

const BAUD_RATE = 921600;
const SOFT_REBOOT_MAGIC = 'S'.charCodeAt(0);
const SERIAL_FILTERS = [
  { usbVendorId: 0x0483, usbProductId: 0x5740 }, // quicksilver
];

class SerialQueue {
  private buffer: number[] = [];
  private canRead = false;

  constructor() {
    this.canRead = true;
  }

  push(array: Uint8Array) {
    for (const v of array) {
      this.buffer.push(v);
    }
  }

  pop(timeout = 10): Promise<number> {
    return new Promise((resolve, reject) => {
      let tries = 100;

      const tryRead = () => {
        if (!this.canRead) {
          return reject("cant read");
        }
        if (this.buffer.length) {
          return resolve(this.buffer.shift()!);
        }
        if (--tries == 0) {
          return reject("read timeout");
        }
        setTimeout(() => tryRead(), timeout);
      }

      tryRead();
    });
  }

  async read(size: number, timeout = 10): Promise<number[]> {
    const buffer: number[] = [];
    for (let i = 0; i < size; i++) {
      buffer.push(await this.pop(timeout));
    }
    return buffer;
  }

  close() {
    this.canRead = false;
  }
}

export class Serial {

  private encoder = new Encoder({
    useRecords: false,
    useFloat32: FLOAT32_OPTIONS.DECIMAL_ROUND,
  });

  private shouldRun = true;
  private queue = new SerialQueue();

  private port?: SerialPort

  private writer?: WritableStreamDefaultWriter<any>;
  private reader?: ReadableStreamDefaultReader<any>;

  private inFlight?: Promise<QuicPacket>;

  private onErrorCallback?: (err: any) => void;

  constructor() { }

  async connect(port: any): Promise<any> {
    console.log("Serial.connect")

    try {
      this.port = await navigator.serial.requestPort({
        filters: SERIAL_FILTERS
      });
      this.queue = new SerialQueue();

      await this.port.open({ baudRate: BAUD_RATE });

      this.writer = await this.port.writable.getWriter();
      this.reader = await this.port.readable.getReader();

      this.shouldRun = true;
      this.startReading();

      return await this.get(QuicVal.Info);
    } catch (err) {
      await this.close();
      throw err;
    }
  }

  async softReboot() {
    await this.write(new Uint8Array([SOFT_REBOOT_MAGIC]));
  }

  onError(fn: any) {
    this.onErrorCallback = fn;
  }

  async get(id: QuicVal): Promise<any> {
    const packet = await this.command(QuicCmd.Get, id);
    if (packet.payload[0] != id) {
      throw new Error("invalid value");
    }
    if (packet.payload.length != 2) {
      throw new Error("no payload");
    }
    return packet.payload[1];
  }

  async get_osd_font() {
    const packet = await this.command(QuicCmd.Get, QuicVal.OSDFont);
    if (packet.payload[0] != QuicVal.OSDFont) {
      throw new Error("invalid value");
    }
    if (packet.payload.length < 2) {
      throw new Error("no payload");
    }
    return packet.payload.slice(1)
  }

  async set(id: QuicVal, val: any): Promise<any> {
    const packet = await this.command(QuicCmd.Set, id, val);
    if (packet.payload[0] != id) {
      throw new Error("invalid value");
    }
    if (packet.payload.length != 2) {
      throw new Error("no payload");
    }
    return packet.payload[1];
  }

  async command(cmd: QuicCmd, ...values: any[]): Promise<QuicPacket> {
    const packet = await this.send(cmd, ...values);
    if (packet.cmd != cmd) {
      throw new Error("invalid command");
    }
    if (packet.flag & QuicFlag.Error) {
      throw new Error(packet.payload[0]);
    }

    // console.log("[quic] recv cmd: %d flag: %d len: %d", packet.cmd, packet.flag, packet.len, packet.payload)

    return packet;
  }

  async close() {
    console.log("Serial.close")

    this.queue.close();
    this.shouldRun = false;

    if (this.reader) {
      try {
        this.reader.cancel();
        await this.reader.releaseLock();
      } catch (err) {
        console.warn(err)
      }
    }

    if (this.writer) {
      try {
        await this.writer.releaseLock();
      } catch (err) {
        console.warn(err)
      }
    }

    try {
      await this.port?.close();
    } catch (err) {
      console.warn(err)
    }

    this.reader = undefined;
    this.writer = undefined;

    this.port = undefined;
  }

  private async send(cmd: QuicCmd, ...values: any[]): Promise<QuicPacket> {
    if (!this.inFlight) {
      return this.inFlight = this._send(cmd, ...values).catch(err => {
        this.inFlight = undefined;
        throw err
      });
    }
    return this.inFlight = this
      .inFlight
      .then(() => this._send(cmd, ...values))
      .catch(err => {
        this.inFlight = undefined;
        throw err
      });
  }

  private async _send(cmd: QuicCmd, ...values: any[]): Promise<QuicPacket> {
    const payload = this.encodeValues(values);

    const request = Uint8Array.from([
      QUIC_MAGIC,
      cmd,
      (payload.length >> 8) & 0xFF,
      (payload.length & 0xFF),
    ]);

    // console.log("[quic] sent cmd: %d len: %d", cmd, payload.length, values)
    await this.write(new Uint8Array([...request, ...payload]));

    return await this.readPacket();
  }

  private async write(array: Uint8Array) {
    if (this.writer) {
      await this.writer.write(array);
    }
  }

  private encodeValues(values: any[]): Uint8Array {
    let result = new Uint8Array();
    for (const v of JSON.parse(JSON.stringify(values))) {
      const encoded = this.encoder.encode(v);
      result = new Uint8Array([...result, ...encoded]);
    }
    return result;
  }

  private async readHeader(timeout = 10): Promise<QuicHeader> {
    const magic = await this.queue.pop(timeout);
    if (!magic || magic != QUIC_MAGIC) {
      throw new Error("invalid magic");
    }

    const header = await this.queue.read(QUIC_HEADER_LEN - 1, timeout);
    return {
      cmd: header[0] & (0xff >> 3),
      flag: (header[0] >> 5),
      len: (header[1]) << 8 | (header[2]),
    }
  }

  private async readPacket(): Promise<QuicPacket> {
    const hdr = await this.readHeader();
    if (hdr.cmd >= QuicCmd.Max || hdr.cmd == QuicCmd.Invalid) {
      throw new Error("invalid command");
    }

    if ((hdr.flag & QuicFlag.Streaming) == 0) {
      const buffer = Uint8Array.from(await this.queue.read(hdr.len));
      return {
        ...hdr,
        payload: this.encoder.decodeMultiple(buffer),
      }
    }

    let buffer = Uint8Array.from(await this.queue.read(hdr.len));
    while (buffer) {
      const nexthdr = await this.readHeader(100);
      if (nexthdr.cmd != hdr.cmd || (nexthdr.flag & QuicFlag.Streaming) == 0) {
        throw new Error("invalid command");
      }
      if (nexthdr.len == 0) {
        break;
      }

      const nextbuffer = Uint8Array.from(await this.queue.read(nexthdr.len, 100));
      buffer = new Uint8Array([...buffer, ...nextbuffer]);
    }

    return {
      ...hdr,
      payload: this.encoder.decodeMultiple(buffer),
    }
  }

  private async startReading() {
    console.log("Serial.startReading")

    while (this.shouldRun) {
      try {
        const { value, done } = await this.reader!.read();
        if (done) {
          break;
        }
        this.queue.push(value);
      } catch (e) {
        this.close();
        if (this.onErrorCallback) {
          this.onErrorCallback(e);
        }
      }
    }
  }
}

export const serial = new Serial();