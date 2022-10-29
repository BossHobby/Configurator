import {
  QuicCmd,
  QuicFlag,
  QuicVal,
  QUIC_HEADER_LEN,
  QUIC_MAGIC,
  type QuicHeader,
  type QuicPacket,
} from "./quic";
import { ArrayWriter, concatUint8Array } from "../util";
import { AsyncQueue, AsyncSemaphore } from "./async";
import { Log } from "@/log";
import { CBOR } from "./cbor";
import { getWebSerial } from "./webserial";
import { settings } from "./settings";

const WebSerial = getWebSerial();

const SOFT_REBOOT_MAGIC = "S".charCodeAt(0);
const HARD_REBOOT_MAGIC = "R".charCodeAt(0);

const SERIAL_FILTERS = [
  { usbVendorId: 0x0483, usbProductId: 0x5740 }, // quicksilver
];

export class Serial {
  private cbor = new CBOR();

  private shouldRun = true;
  private reSync = true;

  private waitingCommands = new AsyncSemaphore(1);

  private port?: any;

  private writer?: WritableStreamDefaultWriter<any>;
  private reader?: AsyncQueue;

  async connect(): Promise<any> {
    try {
      await this._connectPort();
      return await this.get(QuicVal.Info);
    } catch (err) {
      await this.close();
      throw err;
    }
  }

  private async _connectPort() {
    this.port = await WebSerial.requestPort({
      filters: SERIAL_FILTERS,
    });
    this.waitingCommands = new AsyncSemaphore(1);

    await this.port.open({
      baudRate: settings.serial.baudRate,
      bufferSize: settings.serial.bufferSize,
      flowControl: "none",
    });

    this.writer = await this.port.writable.getWriter();
    this.reader = new AsyncQueue(this.port.readable);
    this.shouldRun = true;
  }

  async softReboot() {
    await this.write(new Uint8Array([SOFT_REBOOT_MAGIC]));
  }

  async hardReboot() {
    if (this.port) {
      throw new Error("port already connected");
    }

    await this._connectPort();
    await this.write(new Uint8Array([HARD_REBOOT_MAGIC]));
    await this.close();
  }

  async get(id: QuicVal): Promise<any> {
    const packet = await this.command(QuicCmd.Get, id);
    if (packet.payload[0] != id) {
      throw new Error("invalid value");
    }
    if (packet.payload.length < 2) {
      throw new Error("no payload");
    }
    if (packet.payload.length == 2) {
      return packet.payload[1];
    }
    return packet.payload.slice(1);
  }

  async set(id: QuicVal, ...val: any[]): Promise<any> {
    const packet = await this.command(QuicCmd.Set, id, ...val);
    if (packet.payload[0] != id) {
      throw new Error("invalid value");
    }
    if (packet.payload.length < 2) {
      throw new Error("no payload");
    }
    if (packet.payload.length == 2) {
      return packet.payload[1];
    }
    return packet.payload.slice(1);
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
    this.reSync = true;
    this.shouldRun = false;

    if (this.reader) {
      try {
        await this.reader?.close();
      } catch (err) {
        Log.warn("serial", err);
      }
    }

    if (this.writer) {
      try {
        await this.writer.releaseLock();
      } catch (err) {
        Log.warn("serial", err);
      }
    }

    try {
      await this.port?.close();
    } catch (err) {
      Log.warn("serial", err);
    }

    this.reader = undefined;
    this.writer = undefined;

    this.port = undefined;
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
      (payload.length >> 8) & 0xff,
      payload.length & 0xff,
    ]);

    Log.trace(
      "serial",
      "[quic] sent cmd: %d len: %d",
      cmd,
      payload.length,
      values
    );
    await this.write(concatUint8Array(request, payload));

    let packet = await this.readPacket();
    while (packet.cmd == QuicCmd.Log) {
      Log.info("serial", "[quic] " + packet.payload[0]);
      packet = await this.readPacket();
    }
    Log.trace(
      "serial",
      "[quic] recv cmd: %d flag: %d len: %d",
      packet.cmd,
      packet.flag,
      packet.len,
      packet.payload
    );
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
    while (this.shouldRun) {
      const magic = await this.reader!.pop();
      if (magic === QUIC_MAGIC) {
        this.reSync = false;
        break;
      }
      if (!this.reSync) {
        this.reSync = true;
        console.log("invalid magic " + magic);
        throw new Error("invalid magic " + magic);
      }
    }

    const header = await this.reader!.read(QUIC_HEADER_LEN - 1);
    return {
      cmd: header[0] & (0xff >> 3),
      flag: header[0] >> 5,
      len: (header[1] << 8) | header[2],
    };
  }

  private async readPacket(): Promise<QuicPacket> {
    const hdr = await this.readHeader();
    if (hdr.cmd >= QuicCmd.Max || hdr.cmd == QuicCmd.Invalid) {
      throw new Error("invalid command");
    }

    if ((hdr.flag & QuicFlag.Streaming) == 0) {
      const buffer = Uint8Array.from(await this.reader!.read(hdr.len));
      let payload: any = [];
      if (hdr.len) {
        payload = this.cbor.decodeMultiple(buffer);
      }
      return {
        ...hdr,
        payload,
      };
    }

    const writer = new ArrayWriter();
    writer.writeUint8s(await this.reader!.read(hdr.len));
    Log.trace("serial", "[quic] recv stream chunk", writer.length);

    let counter = 0;
    while (writer) {
      const nexthdr = await this.readHeader();
      if (nexthdr.cmd != hdr.cmd || (nexthdr.flag & QuicFlag.Streaming) == 0) {
        throw new Error("invalid command");
      }
      if (nexthdr.len == 0) {
        break;
      }

      const buf = await this.reader!.read(nexthdr.len);
      writer.writeUint8s(buf);
      Log.trace("serial", "[quic] recv stream chunk", writer.length);
    }

    const payload: any[] = this.cbor.decodeMultiple(writer.array())!;
    return {
      ...hdr,
      payload,
    };
  }
}

export const serial = new Serial();
