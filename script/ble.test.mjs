import assert from "node:assert/strict";
import { test } from "node:test";
import { loadModule } from "./test-module.mjs";
const { BleTransport, defaultBleSettings, resolveEndpoints } = loadModule(
  "../src/store/serial/ble.ts",
  {
    "@capacitor-community/bluetooth-le": { BleClient: {} },
    "@capacitor/core": { Capacitor: { isNativePlatform: () => false } },
    "./ble-scan": { scanForDevice: assert.fail, cancelScan() {} },
    "@/log": { Log: { info() {} } },
  },
);
const props = (on) =>
  Object.fromEntries(
    ["read", "write", "writeWithoutResponse", "notify", "indicate"].map((p) => [
      p,
      on.includes(p),
    ]),
  );
const uart = [
  {
    uuid: defaultBleSettings.writeCharacteristic,
    properties: props(["write"]),
  },
  {
    uuid: defaultBleSettings.notifyCharacteristic,
    properties: props(["notify"]),
  },
];
function mock(overrides = {}) {
  return {
    initialize: async () => {},
    requestDevice: async () => ({ deviceId: "test" }),
    connect: async () => {},
    getServices: async () => [
      { uuid: defaultBleSettings.service, characteristics: uart },
    ],
    startNotifications: async () => {},
    disconnect: async () => {},
    stopNotifications: async () => {},
    write: async () => {},
    ...overrides,
  };
}
test("BLE serializes concurrent writes and splits at the minimum ATT payload", async () => {
  const received = [];
  let inFlight = 0;
  const transport = new BleTransport(
    defaultBleSettings,
    mock({
      async write(id, service, characteristic, view) {
        assert.equal(inFlight++, 0);
        await new Promise(setImmediate);
        received.push([
          ...new Uint8Array(view.buffer, view.byteOffset, view.byteLength),
        ]);
        inFlight--;
      },
    }),
  );
  await transport.connect(() => {}, assert.fail);
  await Promise.all([
    transport.write(Uint8Array.from({ length: 45 }, (_, i) => i)),
    transport.write(new Uint8Array([99])),
  ]);
  assert.deepEqual(
    received.map((c) => c.length),
    [20, 20, 5, 1],
  );
  assert.deepEqual(received.flat(), [...Array(45).keys(), 99]);
  await transport.close();
});
test("notifications honor DataView offsets and ignore stale sessions", async () => {
  const callbacks = [];
  const received = [];
  const transport = new BleTransport(
    defaultBleSettings,
    mock({
      startNotifications: async (_id, _s, _c, fn) => {
        callbacks.push(fn);
      },
    }),
  );
  await transport.connect((data) => received.push([...data]), assert.fail);
  const data = new Uint8Array([0, 1, 2, 3]);
  callbacks[0](new DataView(data.buffer, 1, 2));
  await transport.close();
  await transport.connect((data) => received.push([...data]), assert.fail);
  callbacks[0](new DataView(data.buffer));
  callbacks[1](new DataView(data.buffer, 3, 1));
  assert.deepEqual(received, [[1, 2], [3]]);
  await transport.close();
});
test("disconnect rejects the rest of a queued multi-chunk write", async () => {
  let disconnect;
  let writes = 0;
  const errors = [];
  const transport = new BleTransport(
    defaultBleSettings,
    mock({
      connect: async (_id, fn) => {
        disconnect = fn;
      },
      write: async () => {
        writes++;
        disconnect();
      },
    }),
  );
  await transport.connect(
    () => {},
    (error) => errors.push(error),
  );
  await assert.rejects(transport.write(new Uint8Array(50)), /disconnected/);
  assert.equal(writes, 1);
  assert.equal(errors.length, 1);
  await transport.close();
});
test("failed notification setup disconnects and rejects", async () => {
  let closed = 0;
  const transport = new BleTransport(
    defaultBleSettings,
    mock({
      startNotifications: async () => {
        throw new Error("missing characteristic");
      },
      disconnect: async () => {
        closed++;
      },
    }),
  );
  await assert.rejects(
    transport.connect(() => {}, assert.fail),
    /missing characteristic/,
  );
  assert.equal(closed, 1);
});
test("cancelling during the device picker does not connect afterwards", async () => {
  let choose;
  let connected = false;
  const transport = new BleTransport(
    defaultBleSettings,
    mock({
      requestDevice: () =>
        new Promise((resolve) => {
          choose = resolve;
        }),
      connect: async () => {
        connected = true;
      },
    }),
  );
  const pending = transport.connect(() => {}, assert.fail);
  await new Promise(setImmediate);
  await transport.close();
  choose({ deviceId: "test" });
  await assert.rejects(pending, /cancelled/);
  assert.equal(connected, false);
});
test("characteristics are chosen by property when the layout differs", () => {
  const swapped = [
    {
      uuid: defaultBleSettings.writeCharacteristic,
      properties: props(["notify", "writeWithoutResponse"]),
    },
    { uuid: defaultBleSettings.notifyCharacteristic, properties: props([]) },
  ];
  assert.deepEqual(
    { ...resolveEndpoints(defaultBleSettings, swapped) },
    {
      notify: defaultBleSettings.writeCharacteristic,
      write: defaultBleSettings.writeCharacteristic,
      withResponse: false,
    },
  );
  assert.deepEqual(
    { ...resolveEndpoints(defaultBleSettings, uart) },
    {
      notify: defaultBleSettings.notifyCharacteristic,
      write: defaultBleSettings.writeCharacteristic,
      withResponse: true,
    },
  );
  assert.throws(
    () => resolveEndpoints(defaultBleSettings, [swapped[1]]),
    /no usable/,
  );
});
const scan = loadModule("../src/store/serial/ble-scan.ts", {
  vue: { reactive: (value) => value },
});
test("the in-app scan lists devices and resolves with the chosen one", async () => {
  let report;
  let stopped = 0;
  const client = {
    requestLEScan: async (options, fn) => {
      assert.deepEqual([...options.services], ["svc"]);
      report = fn;
    },
    stopLEScan: async () => {
      stopped++;
    },
  };
  const pending = scan.scanForDevice(client, "svc");
  await new Promise(setImmediate);
  assert.equal(scan.bleScan.scanning, true);
  report({ device: { deviceId: "a", name: "first" }, rssi: -80 });
  report({ device: { deviceId: "b" }, localName: "second", rssi: -50 });
  report({ device: { deviceId: "a", name: "first" }, rssi: -60 });
  assert.deepEqual(
    Array.from(scan.bleScan.devices, (d) => [d.deviceId, d.name, d.rssi]),
    [
      ["a", "first", -60],
      ["b", "second", -50],
    ],
  );
  scan.chooseDevice("b");
  assert.equal(await pending, "b");
  assert.equal(scan.bleScan.selected, "b");
  assert.equal(scan.bleScan.scanning, false);
  assert.equal(stopped, 1);

  const cancelled = scan.scanForDevice(client, "svc");
  await new Promise(setImmediate);
  scan.cancelScan();
  await assert.rejects(cancelled, /cancelled/);
  assert.equal(stopped, 2);
});
