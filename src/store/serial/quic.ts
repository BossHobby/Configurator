export const QUIC_MAGIC = "#".charCodeAt(0);
export const QUIC_HEADER_LEN = 4;

export enum QuicCmd {
  Invalid,
  Get,
  Set,
  Log,
  CalImu,
  Blackbox,
  Motor,
  CalSticks,
  Serial,
  OSD,
  RX,
  Max,
}

export enum QuicVal {
  Invalid,
  Info,
  Profile,
  DefaultProfile,
  State,
  PidRatePresets,
  VtxSettings,
  OSDFont,
  BLHeliSettings, // deprecated
  BindInfo,
  PerfCounters,
  BlackboxPresets,
  Target,
  GpsStatus,
}

export enum QuicBlackbox {
  Reset,
  List,
  Get,
}

export enum QuicMotor {
  TestStatus,
  TestEnable,
  TestDisable,
  TestSetValue,
  Esc4WayIf,
  Serial,
  SetDirection,
}

export enum MotorDirection {
  Normal,
  Reversed,
}

export enum QuicOSD {
  ReadChar,
  WriteChar,
}

export enum QuicRx {
  Bind,
}

export enum QuicFlag {
  None,
  Error,
  Streaming,
  Exit,
}

// Header byte 1 holds the command in bits 0-4, the QuicFlag in bits 5-6 and
// QUIC_HEADER_COMPRESSED in bit 7. A request carrying QUIC_HEADER_COMPRESSED
// accepts an LZSS payload in reply; a reply carries it when its payload is.
export const QUIC_HEADER_CMD_MASK = 0x1f;
export const QUIC_HEADER_FLAG_SHIFT = 5;
export const QUIC_HEADER_FLAG_MASK = 0x3 << QUIC_HEADER_FLAG_SHIFT;
export const QUIC_HEADER_COMPRESSED = 1 << 7;
// First QUIC protocol version that understands QUIC_HEADER_COMPRESSED.
export const QUIC_COMPRESSION_VERSION = "v0.2.10";

export interface QuicHeader {
  cmd: QuicCmd;
  flag: QuicFlag;
  compressed: boolean;
  len: number;
}

export interface QuicPacket extends QuicHeader {
  payload: any;
}
