// CRSF framing shared by the radio-link transports.
export const CRSF_SYNC = 0xc8;
export const CRSF_ADDRESS_FLIGHT_CONTROLLER = 0xc8;
// Address the Configurator uses on the link (the CRSF USB device address).
export const CRSF_ADDRESS_CONFIGURATOR = 0x10;
export const CRSF_PAYLOAD_SIZE_MAX = 60;
const CRSF_FRAME_LENGTH_MAX = 62;

export function crc8(data: Uint8Array): number {
  let crc = 0;
  for (const b of data) {
    crc ^= b;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x80 ? ((crc << 1) ^ 0xd5) & 0xff : (crc << 1) & 0xff;
    }
  }
  return crc;
}

// <sync> <length> <type> <dest> <origin> <payload...> <crc>
export function extendedFrame(
  type: number,
  dest: number,
  origin: number,
  payload: Uint8Array,
): Uint8Array<ArrayBuffer> {
  const frame = new Uint8Array(payload.length + 6);
  frame[0] = CRSF_SYNC;
  frame[1] = payload.length + 4;
  frame[2] = type;
  frame[3] = dest;
  frame[4] = origin;
  frame.set(payload, 5);
  frame[frame.length - 1] = crc8(frame.subarray(2, frame.length - 1));
  return frame;
}

// Splits a byte stream into frame bodies <type> <payload...>, without the
// sync, length and crc bytes, resynchronizing past corrupt data.
export class CrsfFrameParser {
  private pending = new Uint8Array(0);

  push(chunk: Uint8Array): Uint8Array[] {
    const buf = new Uint8Array(this.pending.length + chunk.length);
    buf.set(this.pending);
    buf.set(chunk, this.pending.length);

    const frames: Uint8Array[] = [];
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
      frames.push(body.slice(0, len - 1));
    }
    this.pending = buf.slice(offset);
    return frames;
  }
}
