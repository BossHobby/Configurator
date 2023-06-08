import {
  QuicCmd,
  QuicFlag,
  QuicVal,
  QUIC_HEADER_LEN,
  QUIC_MAGIC,
  type QuicHeader,
  type QuicPacket,
} from "./quic";
import { ArrayWriter, concatUint8Array, stringToUint8Array } from "../util";
import { AsyncQueue, AsyncSemaphore } from "./async";
import { Log } from "@/log";
import { CBOR } from "./cbor";
import { getWebSerial } from "./webserial";
import { settings } from "./settings";

const WebSerial = getWebSerial();

const SOFT_REBOOT_MAGIC = "S";
const HARD_REBOOT_MAGIC = "R";

const SERIAL_FILTERS = [
  { usbVendorId: 0x0483, usbProductId: 0x5740 }, // quicksilver@stm32
  { usbVendorId: 0x2e3c, usbProductId: 0x5740 }, // quicksilver@at32
];

export type ProgressCallbackType = (number) => void;

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noProgress = () => {};

export class Serial {
  private shouldRun = true;
  private reSync = true;

  private waitingCommands = new AsyncSemaphore(1);

  private port?: any;

  private writer?: WritableStreamDefaultWriter<any>;
  private reader?: AsyncQueue;

  public async connect(errorCallback: any = console.warn): Promise<any> {
    try {
      await this._connectPort(errorCallback);
      return await this.get(QuicVal.Info, 10_000);
    } catch (err) {
      await this.close();
      throw err;
    }
  }

  private async _connectPort(errorCallback: any = console.warn) {
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
    this.reader = new AsyncQueue(this.port.readable, errorCallback);
    this.shouldRun = true;
  }

  public async softReboot() {
    await this.write(stringToUint8Array(SOFT_REBOOT_MAGIC));
  }

  public async hardReboot() {
    if (this.port) {
      throw new Error("port already connected");
    }

    await this._connectPort();
    await this.write(stringToUint8Array(HARD_REBOOT_MAGIC));
    await this.write(stringToUint8Array("\r\nbl\r\n"));
    await this.close();
  }

  public async get(id: QuicVal, timeout?: number): Promise<any> {
    const packet = await this._command(QuicCmd.Get, noProgress, timeout, [id]);
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

  public async set(id: QuicVal, ...val: any[]): Promise<any> {
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

  public async command(cmd: QuicCmd, ...values: any[]): Promise<QuicPacket> {
    return this._command(cmd, noProgress, undefined, values);
  }

  public async commandProgress(
    cmd: QuicCmd,
    progress: ProgressCallbackType,
    ...values: any[]
  ): Promise<QuicPacket> {
    return this._command(cmd, progress, undefined, values);
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

  private async _command(
    cmd: QuicCmd,
    progress: ProgressCallbackType,
    timeout: number | undefined,
    values: any[]
  ) {
    await this.waitingCommands.wait();
    try {
      const packet = await this.send(cmd, progress, timeout, values);

      if (packet.cmd != cmd) {
        throw new Error("invalid command");
      }
      if (packet.flag & QuicFlag.Error) {
        throw new Error(packet.payload[0]);
      }

      return packet;
    } finally {
      this.waitingCommands.signal();
    }
  }

  private async write(array: Uint8Array) {
    if (this.writer) {
      await this.writer.write(array);
    } else {
      throw new Error("no serial writer");
    }
  }

  private async send(
    cmd: QuicCmd,
    progress: ProgressCallbackType,
    timeout: number | undefined,
    values: any[]
  ): Promise<QuicPacket> {
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

    let packet = await this.readPacket(progress, timeout);
    while (packet.cmd == QuicCmd.Log) {
      Log.info("serial", "[quic] " + packet.payload[0]);
      packet = await this.readPacket(progress, timeout);
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

  private encodeValues(values: any[]): Uint8Array {
    let result = new Uint8Array();
    for (const v of values) {
      const encoded = CBOR.encode(v);
      result = concatUint8Array(result, encoded);
    }
    return result;
  }

  private async readHeader(timeout: number | undefined): Promise<QuicHeader> {
    if (!this.reader) {
      throw new Error("no serial reader");
    }

    while (this.shouldRun) {
      const magic = await this.reader.pop(timeout);
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

    const header = await this.reader.read(QUIC_HEADER_LEN - 1, timeout);
    return {
      cmd: header[0] & (0xff >> 3),
      flag: header[0] >> 5,
      len: (header[1] << 8) | header[2],
    };
  }

  private async readPacket(
    progress: ProgressCallbackType,
    timeout: number | undefined
  ): Promise<QuicPacket> {
    const hdr = await this.readHeader(timeout);
    if (hdr.cmd >= QuicCmd.Max || hdr.cmd == QuicCmd.Invalid) {
      throw new Error("invalid command");
    }
    if (!this.reader) {
      throw new Error("no serial reader");
    }

    if ((hdr.flag & QuicFlag.Streaming) == 0) {
      const buffer = Uint8Array.from(await this.reader.read(hdr.len, timeout));
      progress(buffer.length);

      let payload: any = [];
      if (hdr.len) {
        payload = CBOR.decodeMultiple(buffer);
      }
      return {
        ...hdr,
        payload,
      };
    }

    const writer = new ArrayWriter();
    writer.writeUint8s(await this.reader.read(hdr.len, timeout));
    Log.trace("serial", "[quic] recv stream chunk", writer.length);
    progress(writer.length);

    while (writer) {
      const nexthdr = await this.readHeader(timeout);
      if (nexthdr.cmd != hdr.cmd || (nexthdr.flag & QuicFlag.Streaming) == 0) {
        throw new Error("invalid command");
      }
      if (nexthdr.len == 0) {
        break;
      }

      const buf = await this.reader.read(nexthdr.len, timeout);
      writer.writeUint8s(buf);
      Log.trace("serial", "[quic] recv stream chunk", writer.length);
      progress(writer.length);
    }

    const payload: any[] = CBOR.decodeMultiple(writer.array());
    return {
      ...hdr,
      payload,
    };
  }
}

export const serial = new Serial();
