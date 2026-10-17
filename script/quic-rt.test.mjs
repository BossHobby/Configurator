import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CRSF_ADDRESS_CONFIGURATOR,
  CRSF_ADDRESS_FLIGHT_CONTROLLER,
  CrsfFrameParser,
  crc8,
  extendedFrame,
} from "../src/store/util/crsf.ts";
import {
  CRSF_FRAMETYPE_QUIC_RT,
  QUIC_RT_VERSION,
  NAV_MISSION_RESUME,
  NavCommand,
  QuicRtType,
  NavResult,
  NavVehicle,
  decodeStatus,
  encodeCommand,
  encodePing,
} from "../src/store/util/quic-rt.ts";

test("GOTO matches the firmware's packed nav_link_goto_t", () => {
  const payload = encodeCommand(
    {
      type: NavCommand.Goto,
      lat: 223000000,
      lon: -1142000000,
      alt: 52.34,
      speed: 7.25,
    },
    9,
  );
  assert.equal(payload.length, 4 + 13);
  assert.deepEqual(
    [...payload.subarray(0, 4)],
    [QUIC_RT_VERSION, QuicRtType.Command, NavCommand.Goto, 9],
  );
  const v = new DataView(payload.buffer, 4);
  assert.equal(v.getInt32(0, true), 223000000);
  assert.equal(v.getInt32(4, true), -1142000000);
  assert.equal(v.getInt32(8, true), 5234, "altitude in cm");
  assert.equal(v.getUint8(12), 73, "speed in 0.1 m/s, rounded");
});

test("argument-free and indexed commands", () => {
  assert.deepEqual(
    [...encodeCommand({ type: NavCommand.Hold }, 0x101)],
    [QUIC_RT_VERSION, QuicRtType.Command, NavCommand.Hold, 1],
    "ids wrap at a byte",
  );
  assert.deepEqual(
    [
      ...encodeCommand(
        { type: NavCommand.Mission, index: NAV_MISSION_RESUME },
        2,
      ),
    ],
    [QUIC_RT_VERSION, QuicRtType.Command, NavCommand.Mission, 2, 0xff],
  );
  const alt = encodeCommand({ type: NavCommand.SetAlt, alt: -1.5 }, 3);
  assert.equal(new DataView(alt.buffer, 4).getInt32(0, true), -150);
  assert.deepEqual([...encodePing()], [QUIC_RT_VERSION, QuicRtType.Ping]);
});

function statusPayload() {
  const payload = new Uint8Array(2 + 23);
  payload[0] = QUIC_RT_VERSION;
  payload[1] = QuicRtType.Status;
  const v = new DataView(payload.buffer, 2);
  v.setUint8(0, 42);
  v.setUint8(1, NavResult.TooFar);
  v.setUint8(2, 0x01 | 0x02 | 0x40 | 0x80);
  v.setUint8(3, NavVehicle.Wing);
  v.setUint8(4, 7);
  v.setUint8(5, 2);
  v.setUint8(6, 5);
  v.setInt32(7, 223000000, true);
  v.setInt32(11, 1142000000, true);
  v.setInt32(15, -223000000, true);
  v.setInt32(19, -1142000000, true);
  return payload;
}

test("STATUS decodes flags and the home and target points", () => {
  const status = decodeStatus(statusPayload());
  assert.ok(status);
  assert.equal(status.commandId, 42);
  assert.equal(status.commandResult, NavResult.TooFar);
  assert.equal(
    status.armed && status.inAir && status.guided && status.guidedReady,
    true,
  );
  assert.equal(status.failsafe || status.mission || status.navigating, false);
  assert.equal(status.vehicle, NavVehicle.Wing);
  assert.equal(status.navState, 7);
  assert.equal(status.missionIndex, 2);
  assert.equal(status.missionCount, 5);
  assert.deepEqual(status.home, { lat: 223000000, lon: 1142000000 });
  assert.deepEqual(status.target, { lat: -223000000, lon: -1142000000 });
});

test("STATUS rejects other versions, types and short payloads", () => {
  const other = statusPayload();
  other[0] = QUIC_RT_VERSION + 1;
  assert.equal(decodeStatus(other), undefined);
  assert.equal(decodeStatus(statusPayload().subarray(0, 20)), undefined);
  assert.equal(decodeStatus(encodePing()), undefined);
});

test("frames survive the stream parser, garbage and splits", () => {
  const frame = extendedFrame(
    CRSF_FRAMETYPE_QUIC_RT,
    CRSF_ADDRESS_CONFIGURATOR,
    CRSF_ADDRESS_FLIGHT_CONTROLLER,
    statusPayload(),
  );
  assert.equal(frame[1], frame.length - 2);
  assert.equal(
    frame[frame.length - 1],
    crc8(frame.subarray(2, frame.length - 1)),
  );

  const parser = new CrsfFrameParser();
  const stream = Uint8Array.of(0x00, 0xff, 0x07, ...frame, ...frame);
  const first = parser.push(stream.subarray(0, 20));
  assert.equal(first.length, 0, "a partial frame waits for the rest");
  const bodies = parser.push(stream.subarray(20));
  assert.equal(bodies.length, 2);
  assert.equal(bodies[0][0], CRSF_FRAMETYPE_QUIC_RT);
  assert.equal(bodies[0][1], CRSF_ADDRESS_CONFIGURATOR);
  assert.equal(bodies[0][2], CRSF_ADDRESS_FLIGHT_CONTROLLER);
  assert.equal(decodeStatus(bodies[0].subarray(3))?.commandId, 42);
});
