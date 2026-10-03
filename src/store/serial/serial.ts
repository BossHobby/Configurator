import {
  QuicCmd,
  QuicFlag,
  QuicVal,
  QUIC_MAGIC,
  type QuicHeader,
  type QuicPacket,
} from "./quic";
import {
  ArrayWriter,
  asyncDelay,
  concatUint8Array,
  stringToUint8Array,
} from "../util";
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
  private ws?: WebSocket;

  private transform?: QuicStream;
  private writer?: WritableStreamDefaultWriter<any>;
  private reader?: ReadableStreamDefaultReader<QuicPacket>;

  private transformClosed?: Promise<void>;
  private errorCallback?: any;
  private closing?: Promise<void>;

  public async connect(errorCallback: any = console.warn): Promise<any> {
    const ws = settings.websocketUrl();
    if (ws) {
      await this._connectWebsocket(ws, errorCallback);
    } else {
      const port = await WebSerial.requestPort({ filters: SERIAL_FILTERS });
      await this._connectPort(port, errorCallback);
    }
    return await this.get(QuicVal.Info, 10_000);
  }

  public async connectFirstPort(
    errorCallback: any = console.warn,
  ): Promise<any> {
    const ws = settings.websocketUrl();
    if (ws) {
      await this._connectWebsocket(ws, errorCallback);
    } else {
      const ports = await WebSerial.getPorts();
      if (!ports.length) throw new Error("no ports");
      await this._connectPort(ports[0], errorCallback);
    }
    return await this.get(QuicVal.Info, 30_000);
  }

  private async _connectPort(port: any, errorCallback: any = console.warn) {
    await this.closing;
    if (this.port || this.ws) throw new Error("already connected");

    this.port = port;
    if (!this.port) {
      return;
    }

    try {
      await this.port.open({
        baudRate: settings.serial.baudRate,
        bufferSize: settings.serial.bufferSize,
        flowControl: "none",
      });
    } catch (err) {
      // An unopened port cannot be closed and must not block reconnects.
      if (this.port === port) this.port = undefined;
      throw err;
    }

    this.errorCallback = errorCallback;
    this.waitingCommands = Promise.resolve({} as any);

    this.writer = await this.port.writable.getWriter();

    this.transform = new QuicStream();
    this.transformClosed = this.port.readable
      .pipeTo(this.transform.writable)
      .catch((err) => {
        Log.trace("serial", "read stream closed", err);
      });
    this.reader = this.transform.readable.getReader();

    while (true) {
      try {
        await this.readPacket(noProgress, 100);
      } catch (err) {
        break;
      }
    }
  }

  private async _connectWebsocket(
    host: string,
    errorCallback: any = console.warn,
  ) {
    await this.closing;
    if (this.port || this.ws) throw new Error("already connected");

    const transform = new QuicStream();
    this.transform = transform;
    const writer = transform.writable.getWriter();
    this.reader = transform.readable.getReader();

    this.errorCallback = errorCallback;
    this.waitingCommands = Promise.resolve({} as any);

    this.transformClosed = Promise.resolve({} as any);

    return new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket("wss://" + host + "/ws");
      this.ws.binaryType = "arraybuffer";
      this.ws.onopen = (e) => {
        resolve();
      };
      this.ws.onmessage = async (e) => {
        try {
          writer.write(new Uint8Array(e.data));
        } catch (e) {
          errorCallback(e);
        }
      };
      this.ws.onclose = (e) => {
        errorCallback(e);
        this.close();
      };
      this.ws.onerror = (e) => {
        errorCallback(e);
        reject(e);
      };
    });
  }

  public async softReboot() {
    try {
      await this.write(stringToUint8Array(SOFT_REBOOT_MAGIC));
    } finally {
      await this.close();
    }
  }

  public async hardReboot() {
    if (this.port) {
      throw new Error("port already connected");
    }

    const port = await WebSerial.requestPort({
      filters: SERIAL_FILTERS,
    });
    try {
      await this._connectPort(port);
      const target = await this.get(QuicVal.Target, 500)
        .then((p) => p.name)
        .catch(() => undefined);
      await asyncDelay(100);
      await this.write(stringToUint8Array(HARD_REBOOT_MAGIC));
      await asyncDelay(100);
      await this.write(stringToUint8Array("\r\nbl\r\n"));
      return target;
    } finally {
      await this.close();
    }
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

  public async commandProgressRaw(
    cmd: QuicCmd,
    progress: ProgressCallbackType,
    ...values: any[]
  ): Promise<QuicPacket> {
    return this._command(cmd, progress, undefined, values, false);
  }

  close(): Promise<void> {
    return (this.closing ??= this.closePort().finally(() => {
      this.closing = undefined;
    }));
  }

  private async closePort() {
    // Detach the streams before cancellation wakes pending reads or timers.
    const reader = this.reader;
    const writer = this.writer;
    this.reader = undefined;
    this.writer = undefined;
    this.errorCallback = undefined;

    const cleanup = async (operation: () => unknown) => {
      try {
        await operation();
      } catch (err) {
        console.warn(err);
      }
    };

    await cleanup(() => reader?.cancel());
    await cleanup(() => this.transformClosed);
    await cleanup(() => reader?.releaseLock());
    await cleanup(() => writer?.close());
    await cleanup(() => writer?.releaseLock());
    this.transformClosed = undefined;
    this.transform = undefined;

    // Retain the port if closing fails so cleanup can be retried.
    await this.port?.close();
    this.port = undefined;
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = undefined;
    }
  }

  private async _command(
    cmd: QuicCmd,
    progress: ProgressCallbackType,
    timeout: number | undefined,
    values: any[],
    decodeStreaming = true,
  ) {
    return (this.waitingCommands = this.waitingCommands
      .then(() => this.send(cmd, progress, timeout, values, decodeStreaming))
      .then((packet) => {
        if (packet.cmd != cmd) {
          throw new Error("invalid command");
        }
        if (packet.flag == QuicFlag.Error) {
          throw new Error(packet.payload[0]);
        }

        return packet;
      })
      .catch((err) => {
        if (this.errorCallback) {
          this.errorCallback(err);
          this.errorCallback = undefined;
        }
        throw err;
      }));
  }

  private async write(array: Uint8Array) {
    if (this.ws) {
      await this.ws?.send(array);
    } else if (this.writer) {
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
    decodeStreaming: boolean,
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

    let packet = await this.readPacket(progress, timeout, decodeStreaming);
    while (packet.cmd == QuicCmd.Log) {
      Log.info("serial", "[quic] " + packet.payload[0]);
      packet = await this.readPacket(progress, timeout, decodeStreaming);
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

  private async readTimeout(timeout: number | undefined) {
    const reader = this.reader;
    const timer = timeout
      ? setTimeout(() => {
          if (reader && this.reader === reader) {
            reader.releaseLock();
            this.reader = this.transform?.readable.getReader();
          }
        }, timeout)
      : undefined;
    try {
      const result = await reader?.read().then((r) => r.value);
      return result;
    } catch (e) {
      if (e instanceof TypeError) {
        throw new Error("timeout");
      } else {
        throw e;
      }
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private async readPacket(
    progress: ProgressCallbackType,
    timeout: number | undefined,
    decodeStreaming = true,
  ): Promise<QuicPacket> {
    if (!this.reader) {
      throw new Error("no serial reader");
    }

    const value = await this.readTimeout(timeout);
    if (!value) {
      throw new Error("no packet");
    }

    if (value.cmd >= QuicCmd.Max || value.cmd == QuicCmd.Invalid) {
      throw new Error("invalid command");
    }

    if (value.flag != QuicFlag.Streaming) {
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
      if (value.cmd != cmd || value.flag != QuicFlag.Streaming) {
        throw new Error("invalid command");
      }
      if (value.len == 0) {
        Log.trace("serial", "[quic] recv stream end", writer.length);
        break;
      }

      writer.writeUint8s(value.payload);
      Log.trace("serial", "[quic] recv stream chunk", writer.length);
      progress(writer.length);
    }

    const payloadBytes = writer.array();
    Log.trace("serial", "[quic] decode stream payload", writer.length);
    const payload: any[] | Uint8Array = decodeStreaming
      ? CBOR.decode(payloadBytes)
      : payloadBytes;
    Log.trace("serial", "[quic] decoded stream payload", payload.length);
    return {
      ...value,
      payload,
    };
  }
}

// Keep the transport alive when Vite replaces this module during HMR. A
// SerialPort is owned by the page's current JS realm; replacing the module
// must not create a second Serial instance while the first one still owns the
// port. The HMR data object is retained by Vite between module evaluations.
const hmrData = import.meta.hot?.data as { serial?: Serial } | undefined;
export const serial = hmrData?.serial ?? new Serial();

import.meta.hot?.dispose((data) => {
  (data as { serial?: Serial }).serial = serial;
});
