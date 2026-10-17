import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CrsfTelemetryType,
  decodeTelemetry,
  unpackAltitude,
  unpackVerticalSpeed,
} from "../src/store/util/crsf-telemetry.ts";

function body(type, build, size) {
  const bytes = new Uint8Array(1 + size);
  bytes[0] = type;
  build(new DataView(bytes.buffer, 1));
  return bytes;
}

test("GPS speed is in 0.1 km/h and altitude has a 1000 m offset", () => {
  const frame = decodeTelemetry(
    body(
      CrsfTelemetryType.Gps,
      (v) => {
        v.setInt32(0, 473456789);
        v.setInt32(4, -1234567);
        v.setUint16(8, 360);
        v.setUint16(10, 12350);
        v.setUint16(12, 1512);
        v.setUint8(14, 14);
      },
      15,
    ),
  );
  assert.deepEqual(frame, {
    type: CrsfTelemetryType.Gps,
    gps: {
      lat: 473456789,
      lon: -1234567,
      groundSpeed: 10,
      course: 123.5,
      altitude: 512,
      sats: 14,
    },
  });
});

test("barometer altitude unpacks the firmware's spec packing", () => {
  // The firmware's test_crsf_baro_altitude_frame_packing cases.
  assert.equal(unpackAltitude(10000), 0);
  assert.equal(unpackAltitude(10123), 12.3);
  assert.equal(unpackAltitude(9950), -5);
  assert.equal(unpackAltitude(3000 | 0x8000), 3000);
  assert.equal(unpackVerticalSpeed(0), 0);
  assert.ok(Math.abs(unpackVerticalSpeed(27) - 1) < 0.03);
  assert.ok(Math.abs(unpackVerticalSpeed(-27) + 1) < 0.03);
  assert.ok(Math.abs(unpackVerticalSpeed(125) - 25) < 0.7);

  const frame = decodeTelemetry(
    body(
      CrsfTelemetryType.BaroAltitude,
      (v) => {
        v.setUint16(0, 10123);
        v.setInt8(2, -27);
      },
      3,
    ),
  );
  assert.equal(frame.type, CrsfTelemetryType.BaroAltitude);
  assert.equal(frame.baroAltitude.altitude, 12.3);
  assert.ok(frame.baroAltitude.verticalSpeed < 0);
});

test("battery, airspeed and attitude use their spec units", () => {
  const battery = decodeTelemetry(
    body(
      CrsfTelemetryType.Battery,
      (v) => {
        v.setInt16(0, 41);
        v.setInt16(2, 123);
        v.setUint16(4, 0x0001);
        v.setUint8(6, 0x2c);
        v.setUint8(7, 80);
      },
      8,
    ),
  );
  assert.deepEqual(battery.battery, {
    voltage: 4.1,
    current: 12.3,
    capacityUsed: 300,
    remaining: 80,
  });

  const airspeed = decodeTelemetry(
    body(CrsfTelemetryType.Airspeed, (v) => v.setUint16(0, 432), 2),
  );
  assert.equal(airspeed.airspeed, 12);

  const attitude = decodeTelemetry(
    body(
      CrsfTelemetryType.Attitude,
      (v) => {
        v.setInt16(0, 2500);
        v.setInt16(2, -5000);
        v.setInt16(4, 10000);
      },
      6,
    ),
  );
  assert.deepEqual(attitude.attitude, { pitch: 0.25, roll: -0.5, yaw: 1 });
});

test("link statistics report negative dBm and the power in mW", () => {
  const frame = decodeTelemetry(
    body(
      CrsfTelemetryType.LinkStatistics,
      (v) => {
        v.setUint8(0, 62);
        v.setUint8(1, 70);
        v.setUint8(2, 100);
        v.setInt8(3, 9);
        v.setUint8(4, 1);
        v.setUint8(5, 2);
        v.setUint8(6, 3);
        v.setUint8(7, 80);
        v.setUint8(8, 98);
        v.setInt8(9, -2);
      },
      10,
    ),
  );
  assert.deepEqual(frame.link, {
    uplinkRssi1: -62,
    uplinkRssi2: -70,
    uplinkQuality: 100,
    uplinkSnr: 9,
    activeAntenna: 1,
    rfMode: 2,
    uplinkPower: 100,
    downlinkRssi: -80,
    downlinkQuality: 98,
    downlinkSnr: -2,
  });

  // The original 5-byte 0x1C payload, without the second antenna.
  const rx = decodeTelemetry(
    Uint8Array.of(CrsfTelemetryType.LinkStatisticsRx, 75, 60, 97, 4, 20),
  );
  assert.deepEqual(rx.linkRx, {
    rssi: -75,
    rssiPercent: 60,
    quality: 97,
    snr: 4,
    power: 20,
  });
});

test("flight mode stops at the terminator", () => {
  const frame = decodeTelemetry(
    Uint8Array.of(
      CrsfTelemetryType.FlightMode,
      0x41,
      0x43,
      0x52,
      0x4f,
      0x2a,
      0,
      0,
    ),
  );
  assert.equal(frame.flightMode, "ACRO*");
});

test("short frames and other types are ignored", () => {
  assert.equal(
    decodeTelemetry(Uint8Array.of(CrsfTelemetryType.Gps, 1, 2, 3)),
    undefined,
  );
  assert.equal(decodeTelemetry(Uint8Array.of(0x84, 0xc8, 0x10)), undefined);
});
