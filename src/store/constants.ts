import { $enum } from 'ts-enum-util';

export enum Features {
  BRUSHLESS = (1 << 1),
  OSD = (1 << 2),
  BLACKBOX = (1 << 3),
  DEBUG = (1 << 4),
}

export enum GyroRotation {
  ROTATE_NONE = 0x0,
  ROTATE_45_CCW = 0x1,
  ROTATE_45_CW = 0x2,
  ROTATE_90_CW = 0x4,
  ROTATE_90_CCW = 0x8,
  ROTATE_180 = 0x10,
  FLIP_180 = 0x20,
}

export enum AuxChannels {
  CHANNEL_5,
  CHANNEL_6,
  CHANNEL_7,
  CHANNEL_8,
  CHANNEL_9,
  CHANNEL_10,
  CHANNEL_11,
  CHANNEL_12,
  CHANNEL_13,
  CHANNEL_14,
  CHANNEL_15,
  CHANNEL_16,
  OFF,
  ON,
  AUX_GESTURE,
}

export enum AuxFunctions {
  AUX_ARMING,
  AUX_IDLE_UP,
  AUX_LEVELMODE,
  AUX_RACEMODE,
  AUX_HORIZON,
  AUX_STICK_BOOST_PROFILE,
  AUX_RATE_PROFILE,
  AUX_BUZZER_ENABLE,
  AUX_TURTLE,
  AUX_MOTOR_TEST,
  AUX_RSSI,
  AUX_FPV_SWITCH,
  AUX_BLACKBOX,
}