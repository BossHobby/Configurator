import assert from "node:assert/strict";
import { test } from "node:test";
import { loadModule } from "./test-module.mjs";

function createSerial(globals) {
  const { Serial } = loadModule(
    "../src/store/serial/serial.ts",
    {
      "./quic": {},
      "../util": {},
      "@/log": {},
      "./cbor": {},
      "./webserial": {},
      "./settings": {},
      "./crsf": {},
      "./ble": {},
      "./transport": {},
      "./connection": {},
    },
    globals,
  );
  return new Serial();
}

test("overlapping closes wait for cancellation and release the port once", async () => {
  const serial = createSerial();
  let finishCancel;
  const cancelled = new Promise((resolve) => {
    finishCancel = resolve;
  });
  let closed = 0;
  serial.reader = { cancel: () => cancelled, releaseLock() {} };
  serial.port = {
    async close() {
      closed++;
    },
  };

  const first = serial.close();
  const second = serial.close();
  assert.equal(first, second);
  assert.equal(closed, 0);
  finishCancel();
  await Promise.all([first, second]);
  assert.equal(closed, 1);
  assert.equal(serial.port, undefined);
  await serial.close();
  assert.equal(closed, 1);
});

test("close releases real stream locks before closing the port", async () => {
  const serial = createSerial();
  const readable = new ReadableStream();
  const writable = new WritableStream();
  const transform = new TransformStream();
  serial.reader = transform.readable.getReader();
  serial.writer = writable.getWriter();
  serial.transfromClosed = readable.pipeTo(transform.writable);
  let closed = false;
  serial.port = {
    async close() {
      assert.equal(readable.locked, false);
      assert.equal(writable.locked, false);
      closed = true;
    },
  };
  await serial.close();
  assert.equal(closed, true);
});

test("read errors clear the timeout before another connection can start", async () => {
  const timers = new Set();
  const serial = createSerial({
    setTimeout(callback) {
      timers.add(callback);
      return callback;
    },
    clearTimeout(timer) {
      timers.delete(timer);
    },
  });
  serial.reader = {
    read: async () => {
      throw new Error("device lost");
    },
  };
  await assert.rejects(serial.readTimeout(100), /device lost/);
  assert.equal(timers.size, 0);
});

test("failed connection waits for port cleanup before clearing connecting state", async () => {
  let finishClose;
  let closeCalled = false;
  const closed = new Promise((resolve) => {
    finishClose = resolve;
  });
  const imports = {
    pinia: { defineStore: (_name, options) => options },
    "@/log": { Log: { error() {} } },
    "@/router": {},
    "./serial/quic": {},
    "./serial/settings": {},
    "./serial/connection": { initialConnection: () => ({ kind: "usb" }) },
    "./serial/webserial": {},
    "./serial/ble-scan": { ScanCancelled: class extends Error {} },
    "./util": {},
    "./serial/serial": {
      serial: {
        close() {
          closeCalled = true;
          return closed;
        },
      },
    },
  };
  const stores = {
    vtx: "VTX",
    profile: "Profile",
    default_profile: "DefaultProfile",
    perf: "Perf",
    bind: "Bind",
    gps: "Gps",
    root: "Root",
    info: "Info",
    motor: "Motor",
    state: "State",
    blackbox: "Blackbox",
    target: "Target",
  };
  for (const [file, name] of Object.entries(stores)) {
    imports[`./${file}`] = {
      [`use${name}Store`]: () => ({
        reset_needs_reboot() {},
        append_alert() {},
      }),
    };
  }
  const { useSerialStore: store } = loadModule(
    "../src/store/serial.ts",
    imports,
    { clearInterval },
  );
  const state = {
    ...store.state(),
    ...store.actions,
    is_connecting: true,
    connect_progress: 0.35,
  };
  const connecting = store.actions.connect.call(
    state,
    Promise.reject(new Error("connect failed")),
  );
  await new Promise(setImmediate);
  assert.equal(closeCalled, true);
  assert.equal(state.is_connecting, true);
  finishClose();
  await connecting;
  assert.equal(state.is_connected, false);
  assert.equal(state.is_connecting, false);
  assert.equal(state.connect_progress, 0);
});

test("wireless receive reassembles QUIC packets across notification boundaries", async () => {
  const quic = loadModule("../src/store/serial/quic.ts", {});
  const { Serial } = loadModule("../src/store/serial/serial.ts", {
    "./quic": quic,
    "../util": {},
    "@/log": { Log: { trace() {} } },
    "./cbor": { CBOR: { decode: (bytes) => [...bytes] } },
    "./webserial": {},
    "./settings": { settings: { serial: { bufferSize: 1024 } } },
    "./crsf": {},
    "./ble": {},
    "./transport": {},
    "./connection": {},
  });
  const serial = new Serial();
  let receive;
  let closed = 0;
  await serial.connectLink(
    {
      connect: async (onData) => {
        receive = onData;
      },
      close: async () => {
        closed++;
      },
    },
    false,
    assert.fail,
  );
  const packet = serial.readPacket(() => {}, 1000);
  receive(Uint8Array.from([quic.QUIC_MAGIC, quic.QuicCmd.Get]));
  receive(Uint8Array.from([0, 3, 5]));
  receive(Uint8Array.from([6, 7]));
  assert.deepEqual((await packet).payload, [5, 6, 7]);
  await serial.close();
  assert.equal(closed, 1);
});
