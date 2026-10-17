// Kept apart from constants.ts, whose stores the blackbox worker must not
// load.
export enum BlackboxField {
  LOOP,
  TIME,
  PID_P_TERM,
  PID_I_TERM,
  PID_D_TERM,
  RX,
  SETPOINT,
  ACCEL_RAW,
  ACCEL_FILTER,
  GYRO_RAW,
  GYRO_FILTER,
  OUTPUT,
  CPU_LOAD,
  GPS_COORD,
  GPS_HOME,
  ALTITUDE,
  DEBUG,
  STATE,
}
