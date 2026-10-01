import assert from "node:assert/strict";
import { test } from "node:test";
import { loadModule } from "./test-module.mjs";
const { CrsfLink } = loadModule("../src/store/serial/crsf.ts", {
  "@/log": { Log: { info() {}, warn() {} } },
  "./transport": {},
});
function crc(data) {
  let n = 0;
  for (const b of data) {
    n ^= b;
    for (let i = 0; i < 8; i++)
      n = n & 128 ? ((n << 1) ^ 0xd5) & 255 : (n << 1) & 255;
  }
  return n;
}
function frame(control, seq, ack, data = []) {
  const bytes = Uint8Array.from([
    0xc8,
    7 + data.length,
    0x7f,
    0x10,
    0xc8,
    control,
    seq,
    ack,
    ...data,
    0,
  ]);
  bytes[bytes.length - 1] = crc(bytes.subarray(2, bytes.length - 1));
  return bytes;
}
test("CRSF handshake and fragmented frames work over an injected byte transport", async () => {
  let receive;
  let closed = 0;
  const sent = [];
  const transport = {
    async connect(onData) {
      receive = onData;
    },
    async write(bytes) {
      sent.push(bytes);
      if (bytes[5] === 1) receive(frame(1, bytes[6], 0));
    },
    async close() {
      closed++;
    },
  };
  const payloads = [];
  const link = new CrsfLink(
    transport,
    (data) => payloads.push([...data]),
    assert.fail,
  );
  try {
    await link.connect(1000);
    const response = frame(0, 0, 0, [35, 42, 99]);
    receive(response.subarray(0, 4));
    receive(response.subarray(4));
    receive(response); // retransmitted sequence must not duplicate payload
    assert.deepEqual(payloads, [[35, 42, 99]]);
    link.write(new Uint8Array([1, 2]));
    assert.ok(
      sent.some((bytes) => bytes[5] === 0 && bytes[8] === 1 && bytes[9] === 2),
    );
  } finally {
    await link.close();
  }
  assert.equal(closed, 1);
});
test("closing a pending CRSF handshake rejects it immediately", async () => {
  const transport = {
    connect: async () => {},
    write: async () => {},
    close: async () => {},
  };
  const link = new CrsfLink(transport, () => {}, assert.fail);
  const connected = link.connect(1000);
  await link.close();
  await assert.rejects(connected, /cancelled/);
});
