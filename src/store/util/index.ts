import semver from 'semver';

export function concatUint8Array(a: Uint8Array, b: Uint8Array): Uint8Array {
  const res = new Uint8Array(a.length + b.length);
  res.set(a);
  res.set(b, a.length);
  return res;
}

export function concatArrayBuffer(a: Uint8Array, b: Uint8Array): Uint8Array {
  const res = new Uint8Array(a.length + b.length);
  res.set(a);
  res.set(b, a.length);
  return res;
}

export class ArrayWriter {
  private offset = 0;
  private buf = new ArrayBuffer(4);
  private view = new DataView(this.buf);

  public get length() {
    return this.offset;
  }

  constructor() { }

  public writeUint8(v: number) {
    this.grow();

    this.view.setUint8(this.offset, v);
    this.offset++;
  }

  public writeUint8s(values: number[]) {
    this.grow(values.length);

    for (const v of values) {
      this.view.setUint8(this.offset, v);
      this.offset++;
    }
  }

  public writeFloat32(v: number) {
    this.grow(4);

    this.view.setFloat32(this.offset, v);
    this.offset += 4;
  }

  public array(): Uint8Array {
    return new Uint8Array(this.buf, 0, this.offset)
  }

  private grow(num: number = 1) {
    if (this.offset + num >= this.buf.byteLength) {
      let newSize = this.buf.byteLength;
      while (newSize < this.offset + num) {
        newSize *= 2;
      }

      const newBuf = new ArrayBuffer(newSize);
      new Uint8Array(newBuf).set(new Uint8Array(this.buf));
      this.buf = newBuf;
      this.view = new DataView(this.buf);
    }
  }
}

export class ArrayReader {
  private offset = 0;
  private buf = new ArrayBuffer(0);
  private view = new DataView(this.buf);

  constructor(buffer?: Uint8Array) {
    if (buffer) {
      this.buf = new ArrayBuffer(buffer.length);
      new Uint8Array(this.buf).set(buffer);
      this.view = new DataView(this.buf);
    }
  }

  public advance(num: number) {
    this.offset += num;
  }

  public remaining(): number {
    return this.buf.byteLength - this.offset;
  }

  public peekUint8(): number {
    return this.view.getUint8(this.offset);
  }

  public peekFloat32(): number {
    return this.view.getFloat32(this.offset);
  }
}

export function decodeSemver(v: number): string {
  return `v${(v >> 16) & 0xFF}.${(v >> 8) & 0xFF}.${(v >> 0) & 0xFF}`
}

export function encodeSemver(version: string): number {
  const v = semver.parse(version)!;
  return (v.major << 16) | (v.minor << 8) | (v.patch & 0xFF);
}