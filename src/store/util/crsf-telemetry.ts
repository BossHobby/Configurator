// Standard CRSF telemetry frames, as forwarded by the CRSF bridge alongside
// QUIC and QUIC_RT. Layouts follow the TBS CRSF spec; multi-byte fields are
// big-endian. Plain functions keep this module runnable under node for
// script/crsf-telemetry.test.mjs.
export const CrsfTelemetryType = {
  Gps: 0x02,
  GpsExtended: 0x06,
  Vario: 0x07,
  Battery: 0x08,
  BaroAltitude: 0x09,
  Airspeed: 0x0a,
  LinkStatistics: 0x14,
  LinkStatisticsRx: 0x1c,
  LinkStatisticsTx: 0x1d,
  Attitude: 0x1e,
  FlightMode: 0x21,
} as const;

export interface CrsfGps {
  lat: number; // degrees * 1e7
  lon: number; // degrees * 1e7
  groundSpeed: number; // m/s
  course: number; // degrees true
  altitude: number; // meters MSL
  sats: number;
}

export interface CrsfGpsExtended {
  fixType: number;
  velocityNorth: number; // m/s
  velocityEast: number; // m/s
  velocityUp: number; // m/s
  horizontalAccuracy: number; // m
  verticalAccuracy: number; // m
  hdop: number;
  vdop: number;
}

export interface CrsfBattery {
  // QUICKSILVER reports the average cell voltage here.
  voltage: number; // V
  current: number; // A
  capacityUsed: number; // mAh
  remaining: number; // %
}

export interface CrsfBaroAltitude {
  altitude: number; // m above launch
  verticalSpeed: number; // m/s up
}

// Uplink is ground to craft, downlink craft to ground.
export interface CrsfLinkStatistics {
  uplinkRssi1: number; // dBm
  uplinkRssi2: number; // dBm
  uplinkQuality: number; // %
  uplinkSnr: number; // dB
  activeAntenna: number;
  rfMode: number;
  uplinkPower: number; // mW, or -1 when unknown
  downlinkRssi: number; // dBm
  downlinkQuality: number; // %
  downlinkSnr: number; // dB
}

// 0x1C reports the ground side's downlink reception, 0x1D the craft's uplink.
export interface CrsfLinkStatisticsSide {
  rssi: number; // dBm
  rssiPercent: number;
  quality: number; // %
  snr: number; // dB
  power: number; // dBm
}

export interface CrsfAttitude {
  pitch: number; // rad
  roll: number; // rad
  yaw: number; // rad
}

export type CrsfTelemetryFrame =
  | { type: typeof CrsfTelemetryType.Gps; gps: CrsfGps }
  | { type: typeof CrsfTelemetryType.GpsExtended; gpsExtended: CrsfGpsExtended }
  | { type: typeof CrsfTelemetryType.Vario; verticalSpeed: number }
  | { type: typeof CrsfTelemetryType.Battery; battery: CrsfBattery }
  | {
      type: typeof CrsfTelemetryType.BaroAltitude;
      baroAltitude: CrsfBaroAltitude;
    }
  | { type: typeof CrsfTelemetryType.Airspeed; airspeed: number }
  | {
      type: typeof CrsfTelemetryType.LinkStatistics;
      link: CrsfLinkStatistics;
    }
  | {
      type: typeof CrsfTelemetryType.LinkStatisticsRx;
      linkRx: CrsfLinkStatisticsSide;
    }
  | {
      type: typeof CrsfTelemetryType.LinkStatisticsTx;
      linkTx: CrsfLinkStatisticsSide;
    }
  | { type: typeof CrsfTelemetryType.Attitude; attitude: CrsfAttitude }
  | { type: typeof CrsfTelemetryType.FlightMode; flightMode: string };

// up_rf_power enum of 0x14.
const LINK_POWER_MW = [0, 10, 25, 100, 500, 1000, 2000, 250, 50];

// Inverse of the spec's packing: dm with a 1000 m offset, or whole meters
// with bit 15 set.
export function unpackAltitude(packed: number): number {
  return packed & 0x8000 ? packed & 0x7fff : (packed - 10000) / 10;
}

// Inverse of the spec's log-scale packing, in m/s.
export function unpackVerticalSpeed(packed: number): number {
  const cms = (Math.exp(Math.abs(packed) * 0.026) - 1) * 100;
  return (Math.sign(packed) * cms) / 100;
}

// Decodes a frame body <type> <payload...>, or returns undefined for other
// types and short frames. Frames may carry extra trailing fields.
export function decodeTelemetry(
  body: Uint8Array,
): CrsfTelemetryFrame | undefined {
  const v = new DataView(body.buffer, body.byteOffset + 1, body.length - 1);
  const size = v.byteLength;
  switch (body[0]) {
    case CrsfTelemetryType.Gps:
      if (size < 15) return undefined;
      return {
        type: CrsfTelemetryType.Gps,
        gps: {
          lat: v.getInt32(0),
          lon: v.getInt32(4),
          groundSpeed: v.getUint16(8) / 36,
          course: v.getUint16(10) / 100,
          altitude: v.getUint16(12) - 1000,
          sats: v.getUint8(14),
        },
      };
    case CrsfTelemetryType.GpsExtended:
      if (size < 20) return undefined;
      return {
        type: CrsfTelemetryType.GpsExtended,
        gpsExtended: {
          fixType: v.getUint8(0),
          velocityNorth: v.getInt16(1) / 100,
          velocityEast: v.getInt16(3) / 100,
          velocityUp: v.getInt16(5) / 100,
          horizontalAccuracy: v.getInt16(13) / 100,
          verticalAccuracy: v.getInt16(15) / 100,
          hdop: v.getUint8(18) / 10,
          vdop: v.getUint8(19) / 10,
        },
      };
    case CrsfTelemetryType.Vario:
      if (size < 2) return undefined;
      return {
        type: CrsfTelemetryType.Vario,
        verticalSpeed: v.getInt16(0) / 100,
      };
    case CrsfTelemetryType.Battery:
      if (size < 8) return undefined;
      return {
        type: CrsfTelemetryType.Battery,
        battery: {
          voltage: v.getInt16(0) / 10,
          current: v.getInt16(2) / 10,
          capacityUsed: (v.getUint16(4) << 8) | v.getUint8(6),
          remaining: v.getUint8(7),
        },
      };
    case CrsfTelemetryType.BaroAltitude:
      if (size < 3) return undefined;
      return {
        type: CrsfTelemetryType.BaroAltitude,
        baroAltitude: {
          altitude: unpackAltitude(v.getUint16(0)),
          verticalSpeed: unpackVerticalSpeed(v.getInt8(2)),
        },
      };
    case CrsfTelemetryType.Airspeed:
      if (size < 2) return undefined;
      return {
        type: CrsfTelemetryType.Airspeed,
        airspeed: v.getUint16(0) / 36,
      };
    case CrsfTelemetryType.LinkStatistics:
      if (size < 10) return undefined;
      return {
        type: CrsfTelemetryType.LinkStatistics,
        link: {
          uplinkRssi1: -v.getUint8(0),
          uplinkRssi2: -v.getUint8(1),
          uplinkQuality: v.getUint8(2),
          uplinkSnr: v.getInt8(3),
          activeAntenna: v.getUint8(4),
          rfMode: v.getUint8(5),
          uplinkPower: LINK_POWER_MW[v.getUint8(6)] ?? -1,
          downlinkRssi: -v.getUint8(7),
          downlinkQuality: v.getUint8(8),
          downlinkSnr: v.getInt8(9),
        },
      };
    case CrsfTelemetryType.LinkStatisticsRx:
    case CrsfTelemetryType.LinkStatisticsTx: {
      if (size < 5) return undefined;
      const side = {
        rssi: -v.getUint8(0),
        rssiPercent: v.getUint8(1),
        quality: v.getUint8(2),
        snr: v.getInt8(3),
        power: v.getUint8(4),
      };
      return body[0] == CrsfTelemetryType.LinkStatisticsRx
        ? { type: CrsfTelemetryType.LinkStatisticsRx, linkRx: side }
        : { type: CrsfTelemetryType.LinkStatisticsTx, linkTx: side };
    }
    case CrsfTelemetryType.Attitude:
      if (size < 6) return undefined;
      return {
        type: CrsfTelemetryType.Attitude,
        attitude: {
          pitch: v.getInt16(0) / 10000,
          roll: v.getInt16(2) / 10000,
          yaw: v.getInt16(4) / 10000,
        },
      };
    case CrsfTelemetryType.FlightMode: {
      const bytes = body.subarray(1);
      const end = bytes.indexOf(0);
      return {
        type: CrsfTelemetryType.FlightMode,
        flightMode: String.fromCharCode(
          ...(end < 0 ? bytes : bytes.subarray(0, end)),
        ),
      };
    }
    default:
      return undefined;
  }
}
