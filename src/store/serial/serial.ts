import { QuicCmd, QuicFlag, QuicHeader, QuicPacket, QuicVal, QUIC_HEADER_LEN, QUIC_MAGIC } from './quic';
import { Encoder, FLOAT32_OPTIONS } from 'cbor-x/encode';

const BAUD_RATE = 921600;

class SerialQueue {
  private buffer: number[] = [];

  push(array: Uint8Array) {
    for (const v of array) {
      this.buffer.push(v);
    }
  }

  pop(): Promise<number> {
    return new Promise((resolve, reject) => {
      let tries = 50;

      const tryRead = () => {
        if (this.buffer.length) {
          return resolve(this.buffer.shift()!);
        }
        if (--tries == 0) {
          return reject("read timeout");
        }
        setTimeout(() => tryRead(), 10);
      }

      tryRead();
    });
  }

  async read(size: number): Promise<number[]> {
    const buffer: number[] = [];
    for (let i = 0; i < size; i++) {
      buffer.push(await this.pop());
    }
    return buffer;
  }
}

export class Serial {

  private encoder = new Encoder({
    useRecords: false,
    useFloat32: FLOAT32_OPTIONS.DECIMAL_FIT,
  });

  private shouldRun = true;
  private queue = new SerialQueue();

  private port?: SerialPort

  private writer?: WritableStreamDefaultWriter<any>;
  private reader?: ReadableStreamDefaultReader<any>;

  private onErrorCallback?: (err: any) => void;

  constructor() { }

  async connect(port: SerialPort): Promise<any> {
    try {
      this.port = port;

      await this.port.open({ baudRate: BAUD_RATE });

      this.writer = await this.port.writable.getWriter();
      this.reader = await this.port.readable.getReader();

      this.startReading();
      return this.get(QuicVal.Info);
    } catch (err) {
      this.close();
      throw err;
    }
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

    console.log("[quic] recv cmd: %d flag: %d len: %d", packet.cmd, packet.flag, packet.len, packet.payload)

    return packet;
  }

  async close() {
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
    const payload = this.encodeValues(values);

    const request = Uint8Array.from([
      QUIC_MAGIC,
      cmd,
      (payload.length >> 8) & 0xFF,
      (payload.length & 0xFF),
    ]);

    console.log("[quic] sent cmd: %d len: %d", cmd, payload.length, values)
    await this.writer!.write(new Uint8Array([...request, ...payload]));

    return this.readPacket();
  }


  private encodeValues(values: any[]): Uint8Array {
    let result = new Uint8Array();
    for (const v of JSON.parse(JSON.stringify(values))) {
      const encoded = this.encoder.encode(v);
      result = new Uint8Array([...result, ...encoded]);
    }
    return result;
  }

  private async readHeader(): Promise<QuicHeader> {
    const magic = await this.queue.pop();
    if (!magic || magic != QUIC_MAGIC) {
      throw new Error("invalid magic");
    }

    const header = await this.queue.read(QUIC_HEADER_LEN - 1);
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

    if (hdr.flag == QuicFlag.Streaming) {
      throw new Error("not implemented")
    }

    const buffer = Uint8Array.from(await this.queue.read(hdr.len));
    return {
      ...hdr,
      payload: this.encoder.decodeMultiple(buffer),
    }
  }

  private async startReading() {
    while (this.shouldRun) {
      try {
        const { value } = await this.reader!.read();
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