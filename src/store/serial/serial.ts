import {
  QuicCmd,
  QuicFlag,
  QuicVal,
  QUIC_MAGIC,
  type QuicHeader,
  type QuicPacket,
} from "./quic";
import { ArrayWriter, concatUint8Array, stringToUint8Array } from "../util";
import { Log } from "@/log";
import { CBOR } from "./cbor";
import { WebSerial } from "./webserial";
import { settings } from "./settings";

const SOFT_REBOOT_MAGIC = "S";
const HARD_REBOOT_MAGIC = "R";

const SERIAL_FILTERS = [
  { usbVendorId: 0x0483, usbProductId: 0x5740 }, // quicksilver@stm32
  { usbVendorId: 0x2e3c, usbProductId: 0x5740 }, // quicksilver@at32
];

export type ProgressCallbackType = (number) => void;

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noProgress = () => {};

enum QuicParserState {
  READ_MAGIC,
  READ_CMD,
  READ_LEN_HIGH,
  READ_LEN_LOW,
  READ_PAYLOAD,
}

class QuicStream extends TransformStream<Uint8Array, QuicPacket> {
  private state: QuicParserState = QuicParserState.READ_MAGIC;
  private header: QuicHeader = {
    cmd: 0,
    flag: 0,
    len: 0,
  };
  private payload = new Uint8Array(0);
  private offset = 0;

  constructor() {
    super({
      transform: (
        chunk: Uint8Array,
        controller: TransformStreamDefaultController<QuicPacket>,
      ) => {
        for (const b of chunk) {
          const p = this.push(b);
          if (p) {
            controller.enqueue(p);
          }
        }
      },
    });
  }

  private push(val: number): QuicPacket | undefined {
    switch (this.state) {
      case QuicParserState.READ_MAGIC:
        if (val == QUIC_MAGIC) {
          this.state = QuicParserState.READ_CMD;
        }
        break;

      case QuicParserState.READ_CMD:
        this.header.cmd = val & (0xff >> 3);
        this.header.flag = val >> 5;
        this.state = QuicParserState.READ_LEN_HIGH;
        break;

      case QuicParserState.READ_LEN_HIGH:
        this.header.len = val << 8;
        this.state = QuicParserState.READ_LEN_LOW;
        break;

      case QuicParserState.READ_LEN_LOW:
        this.header.len |= val;
        this.offset = 0;
        this.payload = new Uint8Array(this.header.len);
        this.state = QuicParserState.READ_PAYLOAD;

        if (this.header.len == 0) {
          this.state = QuicParserState.READ_MAGIC;
          return {
            ...this.header,
            payload: this.payload,
          };
        }
        break;

      case QuicParserState.READ_PAYLOAD:
        this.payload[this.offset++] = val;
        if (this.offset < this.header.len) {
          break;
        }
        this.state = QuicParserState.READ_MAGIC;
        return {
          ...this.header,
          payload: this.payload,
        };
    }
  }
}

export class Serial {
  private waitingCommands: Promise<QuicPacket> = Promise.resolve({} as any);

  private port?: SerialPort;

  private writer?: WritableStreamDefaultWriter<any>;
  private reader?: ReadableStreamDefaultReader<QuicPacket>;

  private transfromClosed?: Promise<void>;
  private errorCallback?: any;

  public async connect(errorCallback: any = console.warn): Promise<any> {
    const port = await WebSerial.requestPort({
      filters: SERIAL_FILTERS,
    });
    await this._connectPort(port, errorCallback);
    return await this.get(QuicVal.Info, 10_000);
  }

  public async connectFirstPort(
    errorCallback: any = console.warn,
  ): Promise<any> {
    const ports = await WebSerial.getPorts();
    if (!ports.length) {
      throw new Error("no ports");
    }
    await this._connectPort(ports[0], errorCallback);
    return await this.get(QuicVal.Info, 10_000);
  }

  private async _connectPort(port: any, errorCallback: any = console.warn) {
    this.port = port;
    if (!this.port) {
      return;
    }

    await this.port.open({
      baudRate: settings.serial.baudRate,
      bufferSize: settings.serial.bufferSize,
      flowControl: "none",
    });

    this.errorCallback = errorCallback;
    this.waitingCommands = Promise.resolve({} as any);

    const transform = new QuicStream();
    this.transfromClosed = this.port.readable.pipeTo(transform.writable);
    this.writer = await this.port.writable.getWriter();
    this.reader = transform.readable.getReader();
  }

  public async softReboot() {
    await this.write(stringToUint8Array(SOFT_REBOOT_MAGIC));
    await this.close();
  }

  public async hardReboot() {
    if (this.port) {
      throw new Error("port already connected");
    }

    const port = await WebSerial.requestPort({
      filters: SERIAL_FILTERS,
    });
    await this._connectPort(port);
    const target = await this.get(QuicVal.Target, 500)
      .then((p) => p.name)
      .catch(() => undefined);
    await this.write(stringToUint8Array(HARD_REBOOT_MAGIC));
    await this.write(stringToUint8Array("\r\nbl\r\n"));
    await this.close();

    return target;
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
    try {
      await this.reader?.cancel().catch(console.warn);
      await (this.transfromClosed || Promise.resolve()).catch(console.warn);
      this.reader?.releaseLock();
    } catch (err) {
      Log.warn("serial", err);
    }

    try {
      await this.writer?.close();
      this.writer?.releaseLock();
    } catch (err) {
      Log.warn("serial", err);
    }

    await this.port?.close().catch(console.warn);

    this.reader = undefined;
    this.writer = undefined;

    this.transfromClosed = undefined;

    this.port = undefined;
  }

  private async _command(
    cmd: QuicCmd,
    progress: ProgressCallbackType,
    timeout: number | undefined,
    values: any[],
  ) {
    return (this.waitingCommands = this.waitingCommands
      .then(() => this.send(cmd, progress, timeout, values))
      .then((packet) => {
        if (packet.cmd != cmd) {
          throw new Error("invalid command");
        }
        if (packet.flag & QuicFlag.Error) {
          throw new Error(packet.payload[0]);
        }

        return packet;
      })
      .catch((err) => {
        if (this.errorCallback) {
          this.errorCallback(err);
        }
        throw err;
      }));
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
    values: any[],
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
      "[quic] sent cmd:",
      cmd,
      "len:",
      payload.length,
      values,
    );

    await this.write(concatUint8Array(request, payload));

    let packet = await this.readPacket(progress, timeout);
    while (packet.cmd == QuicCmd.Log) {
      Log.info("serial", "[quic] " + packet.payload[0]);
      packet = await this.readPacket(progress, timeout);
    }
    Log.trace(
      "serial",
      "[quic] recv cmd:",
      packet.cmd,
      "flag:",
      packet.flag,
      "len:",
      packet.len,
      packet.payload,
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

  private async readPacket(
    progress: ProgressCallbackType,
    timeout: number | undefined,
  ): Promise<QuicPacket> {
    if (!this.reader) {
      throw new Error("no serial reader");
    }

    const promises = [this.reader.read().then((r) => r.value)];
    if (timeout) {
      promises.push(
        new Promise<QuicPacket | undefined>((resolve, reject) =>
          setTimeout(() => reject("timeout"), timeout),
        ),
      );
    }

    const value = await Promise.race(promises);
    if (!value) {
      throw new Error("no packet");
    }

    if (value.cmd >= QuicCmd.Max || value.cmd == QuicCmd.Invalid) {
      throw new Error("invalid command");
    }

    if ((value.flag & QuicFlag.Streaming) == 0) {
      return {
        ...value,
        payload: CBOR.decode(value.payload),
      };
    }

    const writer = new ArrayWriter();
    writer.writeUint8s(value.payload);
    Log.trace("serial", "[quic] recv stream chunk", writer.length);
    progress(writer.length);

    const cmd = value.cmd;
    while (writer) {
      const { value } = await this.reader.read();
      if (!value) {
        throw new Error("no packet");
      }
      if (value.cmd != cmd || (value.flag & QuicFlag.Streaming) == 0) {
        throw new Error("invalid command");
      }
      if (value.len == 0) {
        break;
      }

      writer.writeUint8s(value.payload);
      Log.trace("serial", "[quic] recv stream chunk", writer.length);
      progress(writer.length);
    }

    const payload: any[] = CBOR.decode(writer.array());
    return {
      ...value,
      payload,
    };
  }
}

export const serial = new Serial();
