import { Log } from "@/log";
import { ArrayReader, ArrayWriter } from "../util";

const CBOR_TYPE_OFFSET = 5;
const CBOR_TYPE_MASK = 0xe0;
const CBOR_VALUE_MASK = 0x1f;

enum Max {
  Uint8 = 255,
  Uint16 = 65535,
  Uint32 = 4294967295,
}

enum MajorType {
  UINT = 0x00,
  NINT = 0x01,
  BSTR = 0x02,
  TSTR = 0x03,
  ARRAY = 0x04,
  MAP = 0x05,
  TAG = 0x06,
  FLOAT = 0x07,
}

enum SizeType {
  BYTE = 24,
  SHORT = 25,
  WORD = 26,
  LONG = 27,
  INDEFINITE = 31,
}

function sizeForValue(val: number) {
  if (val <= Max.Uint8) {
    return SizeType.BYTE;
  } else if (val <= Max.Uint16) {
    return SizeType.SHORT;
  } else if (val <= Max.Uint32) {
    return SizeType.WORD;
  }
  return SizeType.LONG;
}

// this is a table matching binary exponents to the multiplier to determine significant digit rounding
const mult10 = new Array(147);
for (let i = 0; i < 256; i++) {
  mult10[i] = +("1e" + Math.floor(45.15 - i * 0.30103));
}

class Encoder {
  private buf = new ArrayWriter();

  public encode(val: any): Uint8Array {
    this.encodeVal(val);
    return this.buf.array();
  }

  private encodeVal(val: any) {
    const typ = typeof val;
    switch (typ) {
      case "number":
        this.encodeNumber(val);
        break;

      case "object":
        if (val instanceof Uint8Array) {
          this.encodeByteString(val);
        } else if (Array.isArray(val)) {
          this.encodeArray(val);
        } else {
          this.encodeObject(val);
        }
        break;

      case "string":
        this.encodeString(val);
        break;

      case "boolean":
        this.encodeHeader(MajorType.FLOAT, val ? 21 : 20);
        break;

      case "undefined":
        this.encodeHeader(MajorType.FLOAT, 23);
        break;

      default:
        Log.error("unhandled type", typ);
        break;
    }
  }

  private encodeNumber(val: number) {
    if (val >>> 0 === val) {
      this.encodeRaw(MajorType.UINT, val, sizeForValue(val));
    } else if (val >> 0 === val) {
      const proxy = -val - 1;
      this.encodeRaw(MajorType.NINT, proxy, sizeForValue(proxy));
    } else {
      this.encodeHeader(MajorType.FLOAT, SizeType.WORD);
      this.buf.writeFloat32(val);
    }
  }

  private encodeObject(value: any) {
    const entries = Object.entries(value);
    this.encodeRaw(MajorType.MAP, entries.length, sizeForValue(entries.length));

    for (const [key, val] of entries) {
      this.encode(key);
      this.encode(val);
    }
  }

  private encodeArray(value: any[]) {
    this.encodeRaw(MajorType.ARRAY, value.length, sizeForValue(value.length));

    for (const val of value) {
      this.encode(val);
    }
  }

  private encodeString(value: string) {
    this.encodeRaw(MajorType.TSTR, value.length, sizeForValue(value.length));

    for (let i = 0; i < value.length; i++) {
      this.buf.writeUint8(value.charCodeAt(i));
    }
  }

  private encodeByteString(value: Uint8Array) {
    this.encodeRaw(MajorType.BSTR, value.length, sizeForValue(value.length));

    for (let i = 0; i < value.length; i++) {
      this.buf.writeUint8(value[i]);
    }
  }

  private encodeRaw(type: MajorType, val: number, max: number) {
    if (max == SizeType.BYTE && val < SizeType.BYTE) {
      return this.encodeHeader(type, val);
    }

    this.encodeHeader(type, max);

    const size = 1 << (max - SizeType.BYTE);
    for (let i = size - 1; i >= 0; i--) {
      this.buf.writeUint8((val >> (i * 8)) & 0xff);
    }
  }

  private encodeHeader(type: MajorType, val: number) {
    return this.buf.writeUint8(
      (type << CBOR_TYPE_OFFSET) | (val & CBOR_VALUE_MASK),
    );
  }
}

class Decoder {
  private buf = new ArrayReader();

  constructor(array: Uint8Array) {
    this.buf = new ArrayReader(array);
  }

  public isEOF(): boolean {
    return this.buf.remaining() == 0;
  }

  public decode(): any {
    const { type, max } = this.decodeType();
    this.buf.advance(1);

    switch (type) {
      case MajorType.UINT:
        return this.decodeRaw(max);

      case MajorType.NINT: {
        const v = this.decodeRaw(max);
        return -1 - v;
      }

      case MajorType.MAP: {
        return this.decodeMap(max);
      }

      case MajorType.ARRAY: {
        return this.decodeArray(max);
      }

      case MajorType.BSTR: {
        const size = this.decodeRaw(max);
        if (this.buf.remaining() < size) {
          throw new Error("EOF");
        }

        const res = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
          res[i] = this.buf.peekUint8();
          this.buf.advance(1);
        }
        return res;
      }

      case MajorType.TSTR: {
        const size = this.decodeRaw(max);
        if (this.buf.remaining() < size) {
          throw new Error("EOF");
        }

        let res = "";
        for (let i = 0; i < size; i++) {
          res += String.fromCharCode(this.buf.peekUint8());
          this.buf.advance(1);
        }
        return res;
      }

      case MajorType.FLOAT:
        return this.decodeFloat(max);

      default:
        Log.error("unhandled type", type);
        break;
    }
  }

  private decodeArray(max: number): any {
    const entriesLeft = this.decodeEntriesLeft(max);

    const res: any[] = [];
    for (let i = 0; i < entriesLeft(); i++) {
      res.push(this.decode());
    }
    return res;
  }

  private decodeMap(max: number): any {
    const entriesLeft = this.decodeEntriesLeft(max);

    const res: any = {};
    for (let i = 0; i < entriesLeft(); i++) {
      const k = this.decode();
      const v = this.decode();
      res[k] = v;
    }
    return res;
  }

  private decodeEntriesLeft(max: number): () => number {
    let count = 0;
    if (max != SizeType.INDEFINITE) {
      count = this.decodeRaw(max);
    }

    return () => {
      if (count) {
        return count;
      }

      if (this.buf.remaining() <= 0) {
        return 0;
      }

      const { type, max } = this.decodeType();
      if (type == MajorType.FLOAT && max == SizeType.INDEFINITE) {
        this.buf.advance(1);
        // break flag, we are done
        return 0;
      }

      return Infinity;
    };
  }

  private decodeSimpleValue(max: number): number | boolean | null | undefined {
    switch (max) {
      case 20:
        return false;
      case 21:
        return true;
      case 22:
        return null;
      case 23:
        return undefined;
      default:
        return max;
    }
  }

  private decodeFloat16(raw: number) {
    const exponent = (raw & 0x7c00) >> 10;
    const fraction = raw & 0x03ff;
    return (
      (raw >> 15 ? -1 : 1) *
      (exponent
        ? exponent === 0x1f
          ? fraction
            ? NaN
            : Infinity
          : Math.pow(2, exponent - 15) * (1 + fraction / 0x400)
        : 6.103515625e-5 * (fraction / 0x400))
    );
  }

  private decodeFloat(max: number): number | boolean | null | undefined {
    switch (max) {
      case SizeType.BYTE: {
        const val = this.decodeSimpleValue(this.buf.peekUint8());
        this.buf.advance(1);
        return val;
      }
      case SizeType.SHORT: {
        const raw = this.buf.peekUint16();
        this.buf.advance(2);
        return this.decodeFloat16(raw);
      }
      case SizeType.WORD: {
        const bytes = [
          this.buf.peekUint8(),
          this.buf.peekUint8(),
          this.buf.peekUint8(),
          this.buf.peekUint8(),
        ];
        const value = this.buf.peekFloat32();
        this.buf.advance(4);

        const mul = mult10[((bytes[0] & 0x7f) << 1) | (bytes[1] >> 7)];
        return ((mul * value + (value > 0 ? 0.5 : -0.5)) >> 0) / mul;
      }
      case SizeType.LONG: {
        const value = this.buf.peekFloat64();
        this.buf.advance(8);
        return value;
      }
      default: {
        if (max < SizeType.BYTE) {
          return this.decodeSimpleValue(max);
        }
        throw new Error("wrong size " + max + " on float");
      }
    }
  }

  private decodeRaw(max: number): number {
    if (max < SizeType.BYTE) {
      return max;
    }

    const size = 1 << (max - SizeType.BYTE);
    if (this.buf.remaining() < size) {
      throw new Error("EOF");
    }

    let val = 0;
    for (let i = size - 1; i >= 0; i--) {
      const v = this.buf.peekUint8();
      this.buf.advance(1);
      val |= v << (i * 8);
    }

    return val >>> 0;
  }

  private decodeType(): { type: MajorType; max: SizeType } {
    if (this.buf.remaining() <= 0) {
      throw new Error("EOF");
    }
    const v = this.buf.peekUint8();
    return {
      type: (v & CBOR_TYPE_MASK) >> CBOR_TYPE_OFFSET,
      max: v & CBOR_VALUE_MASK,
    };
  }
}

export class CBOR {
  public static encode(val: any): Uint8Array {
    return new Encoder().encode(val);
  }

  public static decode(buf: Uint8Array): any[] {
    const res: any[] = [];

    const dec = new Decoder(buf);
    while (!dec.isEOF()) {
      try {
        res.push(dec.decode());
      } catch (err: any) {
        if (err.message != "EOF") {
          throw err;
        }
      }
    }

    return res;
  }
}
