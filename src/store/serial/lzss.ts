// Byte-aligned LZSS matching the firmware's util/lzss.h. A control byte
// precedes each group of up to eight tokens, bit k set when token k is a
// match. Literals are one byte; matches are two bytes, big-endian, holding
// distance - 1 in the upper 11 bits and length - 3 in the lower 5.
const LENGTH_BITS = 5;
const LENGTH_MASK = (1 << LENGTH_BITS) - 1;
const MIN_MATCH = 3;

export function lzssDecode(src: Uint8Array): Uint8Array {
  const out: number[] = [];
  let i = 0;
  while (i < src.length) {
    const control = src[i++];
    for (let k = 0; k < 8 && i < src.length; k++) {
      if (!(control & (1 << k))) {
        out.push(src[i++]);
        continue;
      }
      if (i + 2 > src.length) {
        throw new Error("truncated lzss match");
      }
      const token = (src[i] << 8) | src[i + 1];
      i += 2;
      const dist = (token >> LENGTH_BITS) + 1;
      const len = (token & LENGTH_MASK) + MIN_MATCH;
      if (dist > out.length) {
        throw new Error("invalid lzss distance");
      }
      for (let n = 0; n < len; n++) {
        out.push(out[out.length - dist]);
      }
    }
  }
  return Uint8Array.from(out);
}
