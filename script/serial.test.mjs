import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function loadModule(path, imports, globals = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const exports = {};
  runInNewContext(outputText, {
    exports,
    require: (name) => {
      assert.ok(name in imports, `Unexpected import: ${name}`);
      return imports[name];
    },
    TransformStream,
    Uint8Array,
    TypeError,
    console,
    setTimeout,
    clearTimeout,
    ...globals,
  });
  return exports;
}

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
    "./serial/webserial": {},
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
  const state = { ...store.state(), is_connecting: true };
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
});
