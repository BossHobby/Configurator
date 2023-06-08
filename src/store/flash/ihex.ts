import { concatUint8Array } from "../util";

enum Record {
  DATA = 0,
  END_OF_FILE = 1,
  EXT_SEGMENT_ADDR = 2,
  START_SEGMENT_ADDR = 3,
  EXT_LINEAR_ADDR = 4,
  START_LINEAR_ADDR = 5,
}

const CONFIG_MAGIC = new Uint8Array([0x01, 0x00, 0xaa, 0x12]);

export const ConfigOffsets = {
  stm32f411: 0x0800c000,
  stm32f765: 0x08018000,
  stm32f745: 0x08018000,
  stm32h743: 0x08020000,
  stm32f405: 0x0800c000,
  stm32f722: 0x0800c000,
  at32f435: 0x080f0000,
};

export class IntelHEX {
  public start_linear_address: number;
  public start_segment_address: number;
  public segments: { address: number; data: Uint8Array }[] = [];

  public get linear_bytes_total() {
    return this.end_address - this.start_address;
  }

  public get segment_bytes_total() {
    return this.segments.reduce((p, c) => (p += c.data.length), 0);
  }

  public get start_address() {
    return this.segments[0].address;
  }

  public get end_address() {
    return (
      this.segments[this.segments.length - 1].address +
      this.segments[this.segments.length - 1].data.length
    );
  }

  constructor(start_linear_address: number, start_segment_address: number) {
    this.start_linear_address = start_linear_address;
    this.start_segment_address = start_segment_address;
  }

  private findSegment(offset: number) {
    for (let i = 0; i < this.segments.length; i++) {
      if (
        this.segments[i].address >= offset &&
        offset <= this.segments[i].address + this.segments[i].data.byteLength
      ) {
        return this.segments[i];
      }
    }

    this.segments.push({ address: offset, data: new Uint8Array() });
    return this.segments[this.segments.length - 1];
  }

  public patch(offset: number, data: Uint8Array) {
    data = concatUint8Array(CONFIG_MAGIC, data);

    const seg = this.findSegment(offset);

    const segOffset = seg.address - offset;
    const segSize = segOffset + data.byteLength;
    if (seg.data.byteLength < segSize) {
      seg.data = concatUint8Array(
        seg.data,
        new Uint8Array(segSize - seg.data.byteLength)
      );
    }

    for (let i = segOffset; i < segSize; i++) {
      seg.data[i] = data[i - segOffset];
    }
  }

  public static parse(data: string): IntelHEX {
    let eofReached = false;
    let highAddr = 0;
    let lastAddr = 0;

    const result = new IntelHEX(0, 0);

    const lines = data.split(/\r?\n/);
    for (const line of lines) {
      if (line.length == 0 || line == "") {
        continue;
      }

      const byteCount = parseInt(line.substr(1, 2), 16);
      const address = parseInt(line.substr(3, 4), 16);
      const recordType = parseInt(line.substr(7, 2), 16);
      const dataStr = line.substr(9, byteCount * 2);
      const dataBuffer = IntelHEX.fromHex(dataStr);
      const checksum = parseInt(line.substr(9 + byteCount * 2, 2), 16);

      let calcChecksum =
        (byteCount + (address >> 8) + address + recordType) & 0xff;
      for (let i = 0; i < byteCount; i++)
        calcChecksum = (calcChecksum + dataBuffer[i]) & 0xff;
      calcChecksum = (0x100 - calcChecksum) & 0xff;

      if (checksum != calcChecksum) {
        throw new Error("invalid checksum");
      }

      switch (recordType) {
        // data record
        case Record.DATA: {
          const absoluteAddress = highAddr + address;

          if (lastAddr == 0 || absoluteAddress != lastAddr) {
            result.segments.push({
              address: absoluteAddress,
              data: new Uint8Array(),
            });
          }

          lastAddr = absoluteAddress + byteCount;
          result.segments[result.segments.length - 1].data = concatUint8Array(
            result.segments[result.segments.length - 1].data,
            dataBuffer
          );

          break;
        }

        case Record.END_OF_FILE:
          if (byteCount != 0) {
            throw new Error("invalid END_OF_FILE");
          }
          eofReached = true;
          break;

        case Record.EXT_SEGMENT_ADDR:
          if (byteCount != 2 || address != 0) {
            throw new Error("invalid EXT_SEGMENT_ADDR");
          }
          highAddr = parseInt(dataStr, 16) << 4;
          break;

        case Record.START_SEGMENT_ADDR:
          if (byteCount != 4 || address != 0) {
            throw new Error("invalid START_SEGMENT_ADDR");
          }
          result.start_segment_address = parseInt(dataStr, 16);
          break;

        case Record.EXT_LINEAR_ADDR:
          if (byteCount != 2 || address != 0) {
            throw new Error("invalid EXT_SEGMENT_ADDR");
          }
          highAddr = parseInt(dataStr, 16) << 16;
          break;

        case Record.START_LINEAR_ADDR:
          if (byteCount != 4 || address != 0) {
            throw new Error("invalid START_LINEAR_ADDR");
          }
          result.start_linear_address = parseInt(dataStr, 16);
          break;
      }
    }

    if (!eofReached) {
      throw new Error("no END_OF_FILE record");
    }

    return result;
  }

  private static fromHex(str: string) {
    const buffer = new Uint8Array(Math.ceil(str.length / 2));
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = parseInt(str.substr(i * 2, 2), 16);
    }
    return buffer;
  }
}
