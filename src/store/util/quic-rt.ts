// QUIC_RT, the realtime ground station link in CRSF frame type 0x84, matching
// the firmware's io/quic_rt.h. Unlike the QUIC session on 0x83, which exists
// only on the ground, it also serves armed vehicles. Payloads after the
// extended header are <version> <type> <body...>, little-endian.
export const CRSF_FRAMETYPE_QUIC_RT = 0x84;
export const QUIC_RT_VERSION = 1;

// Const objects instead of enums keep this module runnable under plain node
// for script/quic-rt.test.mjs.
export const QuicRtType = { Status: 0x01, Command: 0x02, Ping: 0x03 } as const;

export const NavCommand = {
  Goto: 0,
  Hold: 1,
  SetAlt: 2,
  RTH: 3,
  Mission: 4,
} as const;
export type NavCommand = (typeof NavCommand)[keyof typeof NavCommand];

export const NavResult = {
  Ok: 0,
  NoAuthority: 1,
  Invalid: 2,
  TooFar: 3,
  NoMission: 4,
  Unsupported: 5,
  None: 7,
} as const;
export type NavResult = (typeof NavResult)[keyof typeof NavResult];

// NavCommand.Mission index that resumes where the mission left off.
export const NAV_MISSION_RESUME = 0xff;

export type NavCommandRequest =
  | {
      type: typeof NavCommand.Goto;
      lat: number;
      lon: number;
      alt: number;
      speed?: number;
    }
  | { type: typeof NavCommand.Hold }
  | { type: typeof NavCommand.SetAlt; alt: number }
  | { type: typeof NavCommand.RTH }
  | { type: typeof NavCommand.Mission; index: number };

export interface NavStatus {
  commandId: number;
  commandResult: NavResult;
  armed: boolean;
  inAir: boolean;
  failsafe: boolean;
  gpsLock: boolean;
  // Navigation owns the controls: multirotor RTH, mission or guided, or any
  // wing navigation such as loiter or cruise.
  navigating: boolean;
  mission: boolean;
  guided: boolean;
  // The pilot's mission switch grants ground station commands.
  guidedReady: boolean;
  missionIndex: number;
  missionCount: number;
  // gps_coord_t points, degrees * 1e7: the launch point while armed, else
  // the craft; and the guided target, mission waypoint or home.
  home: { lat: number; lon: number };
  target: { lat: number; lon: number };
}

// Position, speed, altitude, heading and battery come from the standard CRSF
// frames, see crsf-telemetry.ts.
const STATUS_SIZE = 20;
// The result shares a byte with the mission index.
const RESULT_SHIFT = 5;
const MISSION_INDEX_MASK = (1 << RESULT_SHIFT) - 1;

export function encodePing(): Uint8Array {
  return Uint8Array.of(QUIC_RT_VERSION, QuicRtType.Ping);
}

export function encodeCommand(cmd: NavCommandRequest, id: number): Uint8Array {
  const header = [QUIC_RT_VERSION, QuicRtType.Command, cmd.type, id & 0xff];
  switch (cmd.type) {
    case NavCommand.Goto: {
      const body = new DataView(new ArrayBuffer(13));
      body.setInt32(0, cmd.lat, true);
      body.setInt32(4, cmd.lon, true);
      body.setInt32(8, Math.round(cmd.alt * 100), true);
      body.setUint8(12, Math.min(255, Math.round((cmd.speed ?? 0) * 10)));
      return Uint8Array.of(...header, ...new Uint8Array(body.buffer));
    }
    case NavCommand.SetAlt: {
      const body = new DataView(new ArrayBuffer(4));
      body.setInt32(0, Math.round(cmd.alt * 100), true);
      return Uint8Array.of(...header, ...new Uint8Array(body.buffer));
    }
    case NavCommand.Mission:
      return Uint8Array.of(...header, cmd.index & 0xff);
    default:
      return Uint8Array.of(...header);
  }
}

// Returns the status in a <version> <type> <body> payload, or undefined for
// other messages and versions.
export function decodeStatus(payload: Uint8Array): NavStatus | undefined {
  if (
    payload.length < 2 + STATUS_SIZE ||
    payload[0] != QUIC_RT_VERSION ||
    payload[1] != QuicRtType.Status
  ) {
    return undefined;
  }
  const v = new DataView(payload.buffer, payload.byteOffset + 2, STATUS_SIZE);
  const flags = v.getUint8(1);
  const resultIndex = v.getUint8(2);
  return {
    commandId: v.getUint8(0),
    commandResult: (resultIndex >> RESULT_SHIFT) as NavResult,
    armed: !!(flags & 0x01),
    inAir: !!(flags & 0x02),
    failsafe: !!(flags & 0x04),
    gpsLock: !!(flags & 0x08),
    navigating: !!(flags & 0x10),
    mission: !!(flags & 0x20),
    guided: !!(flags & 0x40),
    guidedReady: !!(flags & 0x80),
    missionIndex: resultIndex & MISSION_INDEX_MASK,
    missionCount: v.getUint8(3),
    home: { lat: v.getInt32(4, true), lon: v.getInt32(8, true) },
    target: { lat: v.getInt32(12, true), lon: v.getInt32(16, true) },
  };
}

export function resultMessage(result: NavResult): string {
  switch (result) {
    case NavResult.Ok:
      return "Accepted";
    case NavResult.NoAuthority:
      return "Not allowed: turn on the mission switch while flying, with no RTH switch or failsafe active.";
    case NavResult.Invalid:
      return "Rejected: the target is outside the altitude or speed limits, or there is no guided target to change.";
    case NavResult.TooFar:
      return "Rejected: the target is more than 2 km from the craft.";
    case NavResult.NoMission:
      return "Rejected: the stored mission has no such waypoint.";
    case NavResult.Unsupported:
      return "This vehicle has no guided flight.";
    default:
      return "No answer";
  }
}
