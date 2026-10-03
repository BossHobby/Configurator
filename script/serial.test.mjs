import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function loadModule(path, imports, globals = {}) {
  const source = readFileSync(
    new URL(path, import.meta.url),
    "utf8",
  ).replaceAll("import.meta.hot", "undefined");
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
      "../util": {
        stringToUint8Array: (value) => new TextEncoder().encode(value),
      },
      "@/log": { Log: { trace() {} } },
      "./cbor": {},
      "./webserial": {},
      "./settings": {
        settings: { serial: { baudRate: 921600, bufferSize: 1024 } },
      },
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
  serial.transformClosed = readable.pipeTo(transform.writable);
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
  const store = createSerialStore(() => {
    closeCalled = true;
    return closed;
  });
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

test("a read timeout cannot acquire another reader while closing", async () => {
  let timeout;
  const serial = createSerial({
    setTimeout(callback) {
      timeout = callback;
      return callback;
    },
    clearTimeout() {},
  });
  let finishCancel;
  const cancelled = new Promise((resolve) => {
    finishCancel = resolve;
  });
  let finishRead;
  serial.reader = {
    read: () =>
      new Promise((resolve) => {
        finishRead = resolve;
      }),
    cancel: () => cancelled,
    releaseLock() {},
  };
  serial.transform = {
    readable: {
      getReader() {
        assert.fail("reader reacquired during close");
      },
    },
  };
  const reading = serial.readTimeout(100);
  const closing = serial.close();
  timeout();
  finishRead({ done: true });
  finishCancel();
  await Promise.all([reading, closing]);
});

test("failed port close retains the handle for a retry", async () => {
  const serial = createSerial();
  let attempts = 0;
  const port = {
    async close() {
      if (++attempts === 1) throw new Error("close failed");
    },
  };
  serial.port = port;
  await assert.rejects(serial.close(), /close failed/);
  assert.equal(serial.port, port);
  await serial.close();
  assert.equal(serial.port, undefined);
  assert.equal(attempts, 2);
});

test("a failed port open allows cleanup and a later connection", async () => {
  const serial = createSerial();
  const openError = new DOMException("Port is busy", "NetworkError");
  let failedPortCloseCalls = 0;
  const failedPort = {
    async open() {
      throw openError;
    },
    async close() {
      failedPortCloseCalls++;
      throw new DOMException("Port is not open", "InvalidStateError");
    },
  };

  await assert.rejects(
    serial._connectPort(failedPort),
    (err) => err === openError,
  );
  await serial.close();
  assert.equal(failedPortCloseCalls, 0);

  let opened = false;
  let closed = false;
  const writes = [];
  const port = {
    readable: new ReadableStream(),
    writable: new WritableStream({
      write(chunk) {
        writes.push(chunk);
      },
    }),
    async open() {
      opened = true;
    },
    async close() {
      assert.equal(this.readable.locked, false);
      assert.equal(this.writable.locked, false);
      closed = true;
    },
  };
  try {
    await serial._connectPort(port);
    assert.equal(opened, true);
    const bytes = Uint8Array.of(1, 2, 3);
    await serial.write(bytes);
    assert.deepEqual(writes, [bytes]);
  } finally {
    await serial.close();
  }
  assert.equal(closed, true);
});

test("opening a port waits until the previous port has closed", async () => {
  const serial = createSerial();
  let finishClose;
  serial.port = {
    close: () =>
      new Promise((resolve) => {
        finishClose = resolve;
      }),
  };
  const closing = serial.close();
  const connecting = serial._connectPort(undefined);
  await new Promise(setImmediate);
  assert.ok(serial.port, "old port must remain owned during close");
  finishClose();
  await Promise.all([closing, connecting]);
  assert.equal(serial.port, undefined);
});

test("soft reboot releases the port when its write fails", async () => {
  const serial = createSerial();
  let closed = false;
  serial.port = {
    async close() {
      closed = true;
    },
  };
  serial.writer = {
    async write() {
      throw new Error("device lost");
    },
    async close() {},
    releaseLock() {},
  };
  await assert.rejects(serial.softReboot(), /device lost/);
  assert.equal(closed, true);
});

function createSerialStore(close) {
  const imports = {
    pinia: { defineStore: (_name, options) => options },
    "@/log": { Log: { error() {} } },
    "@/router": { currentRoute: { value: { fullPath: "/home" } } },
    "./serial/quic": {},
    "./serial/settings": {},
    "./serial/webserial": {},
    "./util": {},
    "./serial/serial": {
      serial: {
        close() {
          return close();
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
  return store;
}

test("disconnect holds connecting state and blocks reconnect until cleanup finishes", async () => {
  let finishClose;
  const store = createSerialStore(
    () =>
      new Promise((resolve) => {
        finishClose = resolve;
      }),
  );
  const state = { ...store.state(), ...store.actions, is_connected: true };
  const disconnecting = state.disconnect();
  assert.equal(state.is_connected, false);
  assert.equal(state.is_connecting, true);
  await state.toggle_connection();
  assert.equal(state.is_connecting, true);
  finishClose();
  await disconnecting;
  assert.equal(state.is_connecting, false);
});
