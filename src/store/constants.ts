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