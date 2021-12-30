import { QuicCmd, QuicFlag, QuicHeader, QuicPacket, QuicVal, QUIC_HEADER_LEN, QUIC_MAGIC } from './quic';
import { concatUint8Array } from '../util';
import { AsyncQueue, AsyncSemaphore } from './async';
import { Log } from '@/log';
import { CBOR } from './cbor';
import { getWebSerial } from './webserial';
import { settings } from '../settings';

const WebSerial = getWebSerial();

const SOFT_REBOOT_MAGIC = 'S'.charCodeAt(0);
const HARD_REBOOT_MAGIC = 'R'.charCodeAt(0);

const SERIAL_FILTERS = [
  { usbVendorId: 0x0483, usbProductId: 0x5740 }, // quicksilver
];

export class Serial {

  private cbor = new CBOR();

  private shouldRun = true;

  private queue = new AsyncQueue();
  private waitingCommands = new AsyncSemaphore(1);

  private port?: any

  private writer?: WritableStreamDefaultWriter<any>;
  private reader?: ReadableStreamDefaultReader<any>;


  private onErrorCallback?: (err: any) => void;

  constructor() { }

  async connect(errorCallback: any = undefined): Promise<any> {
    try {
      this.port = await WebSerial.requestPort({
        filters: SERIAL_FILTERS
      });
      this.queue = new AsyncQueue();
      this.waitingCommands = new AsyncSemaphore(1);
      this.onErrorCallback = errorCallback;

      await this.port.open({
        baudRate: settings.serial.baudRate,
        bufferSize: settings.serial.bufferSize,
        flowControl: 'none',
      });

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

  async hardReboot() {
    if (this.port) {
      throw new Error("port already connected");
    }

    await this.connect();
    await this.write(new Uint8Array([HARD_REBOOT_MAGIC]));
    await this.close();
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

  async set_osd_font(val: any[]) {
    const packet = await this.command(QuicCmd.Set, QuicVal.OSDFont, ...val);
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

    return packet;
  }

  async close() {
    this.queue.close();
    this.shouldRun = false;

    if (this.reader) {
      try {
        this.reader.cancel();
        await this.reader.releaseLock();
      } catch (err) {
        Log.warn('serial', err)
      }
    }

    if (this.writer) {
      try {
        await this.writer.releaseLock();
      } catch (err) {
        Log.warn('serial', err)
      }
    }

    try {
      await this.port?.close();
    } catch (err) {
      Log.warn('serial', err)
    }

    this.reader = undefined;
    this.writer = undefined;

    this.port = undefined;
    this.onErrorCallback = undefined;
  }

  private async send(cmd: QuicCmd, ...values: any[]): Promise<QuicPacket> {
    await this.waitingCommands.wait();
    try {
      return await this._send(cmd, ...values);
    } finally {
      this.waitingCommands.signal();
    }
  }

  private async _send(cmd: QuicCmd, ...values: any[]): Promise<QuicPacket> {
    const payload = this.encodeValues(values);

    const request = Uint8Array.from([
      QUIC_MAGIC,
      cmd,
      (payload.length >> 8) & 0xFF,
      (payload.length & 0xFF),
    ]);

    Log.trace("serial", "[quic] sent cmd: %d len: %d", cmd, payload.length, values)
    await this.write(concatUint8Array(request, payload));

    let packet = await this.readPacket();
    while (packet.cmd == QuicCmd.Log) {
      Log.info("serial", "[quic] " + packet.payload[0]);
      packet = await this.readPacket();
    }
    Log.trace("serial", "[quic] recv cmd: %d flag: %d len: %d", packet.cmd, packet.flag, packet.len, packet.payload)
    return packet;
  }

  private async write(array: Uint8Array) {
    if (this.writer) {
      await this.writer.write(array);
    }
  }

  private encodeValues(values: any[]): Uint8Array {
    let result = new Uint8Array();
    for (const v of values) {
      const encoded = this.cbor.encode(v);
      result = concatUint8Array(result, encoded);
    }
    return result;
  }

  private async readHeader(): Promise<QuicHeader> {
    const magic = await this.queue.pop();
    if (!magic || magic != QUIC_MAGIC) {
      throw new Error("invalid magic " + magic);
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

    if ((hdr.flag & QuicFlag.Streaming) == 0) {
      const buffer = Uint8Array.from(await this.queue.read(hdr.len));
      let payload: any = [];
      if (hdr.len) {
        payload = this.cbor.decodeMultiple(buffer);
      }
      return {
        ...hdr,
        payload,
      }
    }

    let buffer = Uint8Array.from(await this.queue.read(hdr.len));
    while (buffer) {
      const nexthdr = await this.readHeader();
      if (nexthdr.cmd != hdr.cmd || (nexthdr.flag & QuicFlag.Streaming) == 0) {
        throw new Error("invalid command");
      }
      if (nexthdr.len == 0) {
        break;
      }

      const nextbuffer = Uint8Array.from(await this.queue.read(nexthdr.len));
      buffer = concatUint8Array(buffer, nextbuffer);
    }

    const payload: any[] = this.cbor.decodeMultiple(buffer)!;
    return {
      ...hdr,
      payload,
    }
  }

  private async startReading() {
    while (this.shouldRun) {
      try {
        const { value, done } = await this.reader!.read();
        if (done) {
          break;
        }
        this.queue.write(value);
      } catch (e) {
        Log.warning("serial", e)
        this.close();
        if (this.onErrorCallback) {
          this.onErrorCallback(e);
        }
      }
    }
  }
}

export const serial = new Serial();