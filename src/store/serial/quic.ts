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
  BLHeliSettings,
  BindInfo,
  PerfCounters,
  BlackboxPresets,
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
}

export enum QuicFlag {
  None,
  Error,
  Streaming,
  Exit,
}

export interface QuicHeader {
  cmd: QuicCmd;
  flag: QuicFlag;
  len: number;
}

export interface QuicPacket extends QuicHeader {
  payload: any;
}
