import { Log } from "@/log";

// QUIC over CRSF 0x7F frames, tunnelled through a CRSF WebSocket such as the
// TBS Crossfire WiFi module's /ws endpoint. Payload after the extended header:
// <control> <seq> <ack> <QUIC stream bytes...>. RESET carries a random
// session id in the seq field, echoed by the firmware. Matches the
// firmware's io/quic_crsf.h.
const CRSF_SYNC = 0xc8;
const CRSF_FRAMETYPE_QUIC = 0x7f;
const CRSF_ADDRESS_FLIGHT_CONTROLLER = 0xc8;
const CRSF_PAYLOAD_SIZE_MAX = 60;
const CRSF_FRAME_LENGTH_MAX = 62;

const CONTROL_RESET = 0x01;
const HEADER_SIZE = 3;
const DATA_MAX = CRSF_PAYLOAD_SIZE_MAX - 2 - HEADER_SIZE;

const WINDOW = 4;
const RETRANSMIT_MS = 2000;
const RESET_RETRY_MS = 500;
// The firmware treats a session as active for 3 s after its last frame.
const KEEPALIVE_MS = 1000;
const PUMP_MS = 10;

function crc8(data: Uint8Array): number {
  let crc = 0;
  for (const b of data) {
    crc ^= b;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x80 ? ((crc << 1) ^ 0xd5) & 0xff : (crc << 1) & 0xff;
    }
  }
  return crc;
}

export class CrsfLink {
  private ws?: WebSocket;
  private timer?: ReturnType<typeof setInterval>;
  private rxFrame = new Uint8Array(0);

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

  constructor(
    private url: string,
    private onData: (data: Uint8Array) => void,
    private onClose: (err: any) => void,
    private origin = 0x10,
  ) {}

  connect(timeout = 10_000): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);
      ws.binaryType = "arraybuffer";
      this.ws = ws;

      const deadline = setTimeout(() => {
        reject(new Error("crsf session timeout"));
        this.close();
      }, timeout);

      let opened = false;
      ws.onopen = () => {
        this.timer = setInterval(() => {
          if (this.open) {
            if (!opened) {
              opened = true;
              clearTimeout(deadline);
              resolve();
            }
            this.pump();
          } else if (Date.now() - this.lastSend > RESET_RETRY_MS) {
            this.sendFrame(CONTROL_RESET, this.session, new Uint8Array(0));
          }
        }, PUMP_MS);
      };
      ws.onmessage = (e) => this.receive(new Uint8Array(e.data));
      ws.onerror = (e) => {
        clearTimeout(deadline);
        reject(e);
      };
      ws.onclose = (e) => {
        clearTimeout(deadline);
        this.stop();
        this.onClose(e);
      };
    });
  }

  write(data: Uint8Array) {
    for (const b of data) this.txQueue.push(b);
    this.pump();
  }

  close() {
    this.stop();
    if (this.ws) {
      // A requested close is not a link failure.
      this.ws.onclose = null;
      this.ws.close();
    }
    this.ws = undefined;
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
    const payloadSize = 2 + HEADER_SIZE + data.length;
    const frame = new Uint8Array(payloadSize + 4);
    frame[0] = CRSF_SYNC;
    frame[1] = payloadSize + 2;
    frame[2] = CRSF_FRAMETYPE_QUIC;
    frame[3] = CRSF_ADDRESS_FLIGHT_CONTROLLER;
    frame[4] = this.origin;
    frame[5] = control;
    frame[6] = seq;
    frame[7] = this.rxSeq;
    frame.set(data, 8);
    frame[frame.length - 1] = crc8(frame.subarray(2, frame.length - 1));

    this.ackPending = false;
    this.lastSend = Date.now();
    this.ws?.send(frame);
  }

  // The WebSocket carries every CRSF frame routed to it; keep only ours.
  private receive(chunk: Uint8Array) {
    const buf = new Uint8Array(this.rxFrame.length + chunk.length);
    buf.set(this.rxFrame);
    buf.set(chunk, this.rxFrame.length);

    let offset = 0;
    while (buf.length - offset >= 2) {
      const len = buf[offset + 1];
      if (len < 2 || len > CRSF_FRAME_LENGTH_MAX) {
        offset++;
        continue;
      }
      if (buf.length - offset < len + 2) break;

      const body = buf.subarray(offset + 2, offset + 2 + len);
      if (crc8(body.subarray(0, len - 1)) != body[len - 1]) {
        offset++;
        continue;
      }
      offset += len + 2;
      this.handleFrame(body.subarray(0, len - 1));
    }
    this.rxFrame = buf.slice(offset);
  }

  private handleFrame(body: Uint8Array) {
    // body: <type> <dest> <origin> <control> <seq> <ack> <data...>
    if (
      body[0] != CRSF_FRAMETYPE_QUIC ||
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
