import { Log } from "@/log";
import {
  CRSF_ADDRESS_CONFIGURATOR,
  CRSF_ADDRESS_FLIGHT_CONTROLLER,
  CRSF_PAYLOAD_SIZE_MAX,
  CrsfFrameParser,
  extendedFrame,
} from "../util/crsf";
import { CrsfBluetooth } from "./ble";

// QUIC over CRSF 0x83 frames, tunnelled through a CRSF bridge such as the
// TBS Crossfire WiFi module's /ws WebSocket or its Bluetooth serial service.
// Payload after the extended header: <control> <seq> <ack> <QUIC stream
// bytes...>. RESET carries a random session id in the seq field, echoed by
// the firmware. Matches the firmware's io/quic_crsf.h.
const CRSF_FRAMETYPE_QUIC = 0x83;

const CONTROL_RESET = 0x01;
const HEADER_SIZE = 3;
const DATA_MAX = CRSF_PAYLOAD_SIZE_MAX - 2 - HEADER_SIZE;

const WINDOW = 4;
const RETRANSMIT_MS = 2000;
const RESET_RETRY_MS = 500;
// The firmware treats a session as active for 3 s after its last frame.
const KEEPALIVE_MS = 1000;
const PUMP_MS = 10;

type FrameListener = { type: number; fn: (body: Uint8Array) => void };

/** The socket key of the Bluetooth bridge; other keys are WebSocket URLs. */
export const CRSF_BLUETOOTH = "ble";

/** A byte pipe carrying raw CRSF frames to and from a CRSF bridge. */
export interface CrsfTransport {
  open(
    onData: (chunk: Uint8Array) => void,
    onClose: (err: any) => void,
  ): Promise<void>;
  send(frame: Uint8Array<ArrayBuffer>): void;
  /** Closes without reporting it through onClose. */
  close(): void;
}

class CrsfWebSocket implements CrsfTransport {
  private ws?: WebSocket;

  constructor(private url: string) {}

  open(
    onData: (chunk: Uint8Array) => void,
    onClose: (err: any) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);
      ws.binaryType = "arraybuffer";
      this.ws = ws;
      ws.onopen = () => resolve();
      ws.onerror = (e) => reject(e);
      ws.onmessage = (e) => onData(new Uint8Array(e.data));
      ws.onclose = (e) => onClose(e);
    });
  }

  send(frame: Uint8Array<ArrayBuffer>) {
    if (this.ws?.readyState == WebSocket.OPEN) this.ws.send(frame);
  }

  close() {
    if (!this.ws) return;
    this.ws.onclose = null;
    this.ws.close();
    this.ws = undefined;
  }
}

// One bridge connection per key, shared by everything that talks over it and
// closed with its last user. Frame bodies are <type> <dest> <origin>
// <payload...>.
export class CrsfSocket {
  private static sockets = new Map<string, CrsfSocket>();

  private transport: CrsfTransport;
  private opened: Promise<void>;
  private parser = new CrsfFrameParser();
  private listeners = new Set<FrameListener>();
  private closeListeners = new Set<(err: any) => void>();
  private refs = 0;

  static acquire(key: string): CrsfSocket {
    let socket = CrsfSocket.sockets.get(key);
    if (!socket) {
      socket = new CrsfSocket(key);
      CrsfSocket.sockets.set(key, socket);
    }
    socket.refs++;
    return socket;
  }

  private constructor(private key: string) {
    this.transport =
      key == CRSF_BLUETOOTH ? new CrsfBluetooth() : new CrsfWebSocket(key);
    this.opened = this.transport.open(
      (chunk) => {
        for (const body of this.parser.push(chunk)) {
          for (const listener of this.listeners) {
            if (listener.type == body[0]) listener.fn(body);
          }
        }
      },
      (e) => {
        this.forget();
        for (const fn of this.closeListeners) fn(e);
      },
    );
    // Rejections reach callers of open(); a failed bridge is not reused.
    this.opened.catch(() => this.forget());
  }

  open(): Promise<void> {
    return this.opened;
  }

  send(frame: Uint8Array<ArrayBuffer>) {
    this.transport.send(frame);
  }

  on(type: number, fn: (body: Uint8Array) => void): () => void {
    const listener = { type, fn };
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onClose(fn: (err: any) => void): () => void {
    this.closeListeners.add(fn);
    return () => this.closeListeners.delete(fn);
  }

  release() {
    if (--this.refs > 0) return;
    this.forget();
    // A requested close is not a link failure.
    this.transport.close();
  }

  private forget() {
    if (CrsfSocket.sockets.get(this.key) == this) {
      CrsfSocket.sockets.delete(this.key);
    }
  }
}

export class CrsfLink {
  private socket?: CrsfSocket;
  private unsubscribe: (() => void)[] = [];
  private timer?: ReturnType<typeof setInterval>;

  private open = false;
  private session = Math.floor(Math.random() * 256);
  private rxSeq = 0;
  private txSeq = 0;
  private inflight: number[] = [];
  private txQueue: number[] = [];
  private txSent = 0;
  private txTime = 0;
  private lastSend = 0;
  private ackPending = false;
  // Rejects the session being opened, if any.
  private opening?: (err: any) => void;

  constructor(
    private key: string,
    private onData: (data: Uint8Array) => void,
    private onClose: (err: any) => void,
    private origin = CRSF_ADDRESS_CONFIGURATOR,
  ) {}

  connect(timeout = 10_000): Promise<void> {
    const socket = CrsfSocket.acquire(this.key);
    this.socket = socket;
    this.unsubscribe = [
      socket.on(CRSF_FRAMETYPE_QUIC, (body) => {
        this.handleFrame(body);
        // Acknowledge, and refill the window freed by acks, without waiting
        // for the next pump tick; the firmware stalls once its window is in
        // flight.
        this.pump();
      }),
      socket.onClose((e) => {
        this.opening?.(e);
        this.stop();
        this.onClose(e);
      }),
    ];

    const session = this.openSession(timeout, socket.open());
    session.catch(() => this.close());
    return session;
  }

  // Sends RESET until the flight controller answers it, then pumps the stream.
  private openSession(timeout: number, ready: Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      const fail = (err: any) => {
        clearTimeout(deadline);
        this.opening = undefined;
        this.stop();
        reject(err);
      };
      const deadline = setTimeout(
        () => fail(new Error("crsf session timeout")),
        timeout,
      );
      this.opening = fail;

      ready.then(() => {
        if (this.opening !== fail) return;
        this.timer = setInterval(() => {
          if (this.open) {
            if (this.opening === fail) {
              clearTimeout(deadline);
              this.opening = undefined;
              resolve();
            }
            this.pump();
          } else if (Date.now() - this.lastSend > RESET_RETRY_MS) {
            this.sendFrame(CONTROL_RESET, this.session, new Uint8Array(0));
          }
        }, PUMP_MS);
      }, fail);
    });
  }

  write(data: Uint8Array) {
    for (const b of data) this.txQueue.push(b);
    this.pump();
  }

  close() {
    this.stop();
    for (const unsubscribe of this.unsubscribe) unsubscribe();
    this.unsubscribe = [];
    this.socket?.release();
    this.socket = undefined;
  }

  private stop() {
    clearInterval(this.timer);
    this.timer = undefined;
    this.open = false;
  }

  private pump() {
    if (!this.open) return;

    const now = Date.now();
    if (this.inflight.length && now - this.txTime > RETRANSMIT_MS) {
      Log.warn("crsf", "retransmit from seq", this.txSeq);
      this.inflight = [];
      this.txSent = 0;
    }

    while (this.inflight.length < WINDOW && this.txSent < this.txQueue.length) {
      const chunk = Uint8Array.from(
        this.txQueue.slice(this.txSent, this.txSent + DATA_MAX),
      );
      if (!this.inflight.length) this.txTime = now;
      const seq = (this.txSeq + this.inflight.length) & 0xff;
      this.txSent += chunk.length;
      this.inflight.push(this.txSent);
      this.sendFrame(0, seq, chunk);
    }

    if (this.ackPending || now - this.lastSend > KEEPALIVE_MS) {
      this.sendFrame(
        0,
        (this.txSeq + this.inflight.length) & 0xff,
        new Uint8Array(0),
      );
    }
  }

  private sendFrame(control: number, seq: number, data: Uint8Array) {
    const payload = new Uint8Array(HEADER_SIZE + data.length);
    payload[0] = control;
    payload[1] = seq;
    payload[2] = this.rxSeq;
    payload.set(data, HEADER_SIZE);

    this.ackPending = false;
    this.lastSend = Date.now();
    this.socket?.send(
      extendedFrame(
        CRSF_FRAMETYPE_QUIC,
        CRSF_ADDRESS_FLIGHT_CONTROLLER,
        this.origin,
        payload,
      ),
    );
  }

  private handleFrame(body: Uint8Array) {
    // body: <type> <dest> <origin> <control> <seq> <ack> <data...>
    if (
      body.length < 3 + HEADER_SIZE ||
      body[1] != this.origin ||
      body[2] != CRSF_ADDRESS_FLIGHT_CONTROLLER
    ) {
      return;
    }

    const control = body[3];
    const seq = body[4];
    const ack = body[5];
    const data = body.subarray(6);

    if (control & CONTROL_RESET) {
      if (!this.open && seq == this.session) {
        Log.info("crsf", "session open");
        this.open = true;
        this.rxSeq = 0;
        this.txSeq = 0;
        this.inflight = [];
        this.txSent = 0;
      }
      return;
    }
    if (!this.open) return;

    const acked = (ack - this.txSeq) & 0xff;
    if (acked > 0 && acked <= this.inflight.length) {
      const end = this.inflight[acked - 1];
      this.txQueue.splice(0, end);
      this.inflight = this.inflight.slice(acked).map((e) => e - end);
      this.txSent -= end;
      this.txSeq = ack;
      this.txTime = Date.now();
    }

    if (!data.length) return;
    this.ackPending = true;
    if (seq != this.rxSeq) return;
    this.rxSeq = (this.rxSeq + 1) & 0xff;
    this.onData(data.slice());
  }
}
