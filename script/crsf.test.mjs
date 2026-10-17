import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CRSF_ADDRESS_CONFIGURATOR,
  CRSF_ADDRESS_FLIGHT_CONTROLLER,
  CrsfFrameParser,
  crc8,
  extendedFrame,
} from "../src/store/util/crsf.ts";
import { resolveEndpoints } from "../src/store/serial/ble.ts";

const uart = (id) => `6e40000${id}-b5a3-f393-e0a9-e50e24dcca9e`;
const characteristic = (uuid, props) => ({
  uuid,
  properties: {
    write: false,
    writeWithoutResponse: false,
    notify: false,
    indicate: false,
    ...props,
  },
});

test("the Crossfire module writes 0003 and notifies on 0002", () => {
  const { write, notify } = resolveEndpoints([
    characteristic(uart(3), { write: true, writeWithoutResponse: true }),
    characteristic(uart(2), { notify: true }),
  ]);
  assert.equal(write.uuid, uart(3));
  assert.equal(notify.uuid, uart(2));
});

test("Nordic's own layout is found by properties", () => {
  const { write, notify } = resolveEndpoints([
    characteristic(uart(2), { write: true }),
    characteristic(uart(3), { notify: true }),
  ]);
  assert.equal(write.uuid, uart(2));
  assert.equal(notify.uuid, uart(3));
});

test("a service without a notify characteristic is rejected", () => {
  assert.throws(() =>
    resolveEndpoints([characteristic(uart(3), { write: true })]),
  );
});

test("frames survive the stream parser, garbage and splits", () => {
  const frame = extendedFrame(
    0x83,
    CRSF_ADDRESS_CONFIGURATOR,
    CRSF_ADDRESS_FLIGHT_CONTROLLER,
    Uint8Array.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12),
  );
  assert.equal(frame[1], frame.length - 2);
  assert.equal(
    frame[frame.length - 1],
    crc8(frame.subarray(2, frame.length - 1)),
  );

  const parser = new CrsfFrameParser();
  const stream = Uint8Array.of(0x00, 0xff, 0x07, ...frame, ...frame);
  const first = parser.push(stream.subarray(0, 12));
  assert.equal(first.length, 0, "a partial frame waits for the rest");
  const bodies = parser.push(stream.subarray(12));
  assert.equal(bodies.length, 2);
  assert.deepEqual(
    [...bodies[0].subarray(0, 4)],
    [0x83, CRSF_ADDRESS_CONFIGURATOR, CRSF_ADDRESS_FLIGHT_CONTROLLER, 1],
  );
});
