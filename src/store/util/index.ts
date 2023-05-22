import semver from "semver";

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

export function stringToUint8Array(str: string): Uint8Array {
  const res = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    res[i] = str.charCodeAt(i);
  }
  return res;
}

export class ArrayWriter {
  private offset = 0;
  private buf = new ArrayBuffer(4);
  private view = new DataView(this.buf);

  public get length() {
    return this.offset;
  }

  constructor(private litteEndian = true) {}

  public get(index: number): number {
    return this.view.getUint8(index);
  }

  public writeUint8(v: number) {
    this.grow();

    this.view.setUint8(this.offset, v);
    this.offset++;
  }

  public writeUint16(v: number) {
    this.grow(2);

    this.view.setUint16(this.offset, v, this.litteEndian);
    this.offset += 2;
  }

  public writeUint8s(values: ArrayLike<number>) {
    this.grow(values.length);

    for (let i = 0; i < values.length; i++) {
      this.view.setUint8(this.offset, values[i]);
      this.offset++;
    }
  }

  public writeFloat32(v: number) {
    this.grow(4);

    this.view.setFloat32(this.offset, v);
    this.offset += 4;
  }

  public array(): Uint8Array {
    return new Uint8Array(this.buf, 0, this.offset);
  }

  private grow(num = 1) {
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

  public peekUint16(): number {
    return this.view.getUint16(this.offset);
  }

  public peekFloat32(): number {
    return this.view.getFloat32(this.offset);
  }

  public peekFloat64(): number {
    return this.view.getFloat64(this.offset);
  }
}

export function decodeSemver(v: number): string {
  return `v${(v >> 16) & 0xff}.${(v >> 8) & 0xff}.${(v >> 0) & 0xff}`;
}

export function encodeSemver(version: string): number {
  const v = semver.parse(version)!;
  return (v.major << 16) | (v.minor << 8) | (v.patch & 0xff);
}
