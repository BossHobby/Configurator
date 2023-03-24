import { defineStore } from "pinia";
import semver from "semver";
import { useInfoStore } from "./info";

enum Features {
  BRUSHLESS = 1 << 1,
  OSD = 1 << 2,
  BLACKBOX = 1 << 3,
  DEBUG = 1 << 4,
}

enum GyroRotation {
  ROTATE_NONE = 0x0,
  ROTATE_45_CCW = 0x1,
  ROTATE_45_CW = 0x2,
  ROTATE_90_CW = 0x4,
  ROTATE_90_CCW = 0x8,
  ROTATE_180 = 0x10,
  FLIP_180 = 0x20,
}

enum GyroType {
  INVALID,

  MPU6000,
  MPU6500,

  ICM20601,
  ICM20602,
  ICM20608,
  ICM20649,
  ICM20689,

  ICM42605,
  ICM42688P,

  BMI270,
}

enum AuxChannels {
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

enum AuxFunctionsV010 {
  AUX_ARMING,
  AUX_IDLE_UP,
  AUX_LEVELMODE,
  AUX_RACEMODE,
  AUX_HORIZON,
  AUX_STICK_BOOST_PROFILE,
  _AUX_RATE_PROFILE,
  AUX_BUZZER_ENABLE,
  AUX_TURTLE,
  AUX_MOTOR_TEST,
  AUX_RSSI,
  AUX_FPV_SWITCH,
  AUX_BLACKBOX,
}

enum AuxFunctionsV011 {
  AUX_ARMING,
  AUX_IDLE_UP,
  AUX_LEVELMODE,
  AUX_RACEMODE,
  AUX_HORIZON,
  AUX_STICK_BOOST_PROFILE,
  _AUX_RATE_PROFILE,
  AUX_BUZZER_ENABLE,
  AUX_TURTLE,
  AUX_MOTOR_TEST,
  AUX_RSSI,
  AUX_FPV_SWITCH,
  AUX_BLACKBOX,
  AUX_PREARM,
}

enum RXProtocolV5 {
  INVALID,
  UNIFIED_SERIAL,
  SBUS,
  CRSF,
  IBUS,
  FPORT,
  DSMX_2048,
  DSM2_1024,
  NRF24_BAYANG_TELEMETRY,
  BAYANG_PROTOCOL_BLE_BEACON,
  BAYANG_PROTOCOL_TELEMETRY_AUTOBIND,
  FRSKY_D8,
  FRSKY_D16,
  REDPINE,
  EXPRESS_LRS,
}

enum RXProtocolV010 {
  INVALID,
  UNIFIED_SERIAL,
  SBUS,
  CRSF,
  IBUS,
  FPORT,
  DSM,
  NRF24_BAYANG_TELEMETRY,
  BAYANG_PROTOCOL_BLE_BEACON,
  BAYANG_PROTOCOL_TELEMETRY_AUTOBIND,
  FRSKY_D8,
  FRSKY_D16,
  REDPINE,
  EXPRESS_LRS,
}

enum RXProtocolV011 {
  INVALID,
  UNIFIED_SERIAL,
  SBUS,
  CRSF,
  IBUS,
  FPORT,
  DSM,
  NRF24_BAYANG_TELEMETRY,
  BAYANG_PROTOCOL_BLE_BEACON,
  BAYANG_PROTOCOL_TELEMETRY_AUTOBIND,
  FRSKY_D8,
  FRSKY_D16_FCC,
  FRSKY_D16_LBT,
  REDPINE,
  EXPRESS_LRS,
  FLYSKY_AFHDS,
  FLYSKY_AFHDS2A,
}

enum RXSerialProtocol {
  INVALID,
  DSM,
  SBUS,
  IBUS,
  FPORT,
  CRSF,
  REDPINE,
  SBUS_INVERTED,
  FPORT_INVERTED,
  REDPINE_INVERTED,
}

export enum StickWizardState {
  STICK_WIZARD_INACTIVE,
  STICK_WIZARD_SUCCESS,
  STICK_WIZARD_FAILED,
  STICK_WIZARD_START,
  STICK_WIZARD_CAPTURE_STICKS,
  STICK_WIZARD_WAIT_FOR_CONFIRM,
  STICK_WIZARD_CONFIRMED,
  STICK_WIZARD_TIMEOUT,
}

enum Failloop {
  FAILLOOP_NONE = 0,
  FAILLOOP_LOW_BATTERY = 2, // - low battery at powerup - currently unused
  FAILLOOP_RADIO = 3, // - radio chip not found
  FAILLOOP_GYRO = 4, // - gyro not found
  FAILLOOP_FAULT = 5, // - clock, intterrupts, systick, gcc bad code, bad memory access (code issues like bad pointers) - this should not come up
  FAILLOOP_LOOPTIME = 6, // - loop time issue - if loop time exceeds 20mS
  FAILLOOP_SPI = 7, // - spi error  - triggered by hardware spi driver only
  FAILLOOP_SPI_MAIN = 8, // - spi error main loop  - triggered by hardware spi driver only
}

export const FailloopMessages = {
  [Failloop.FAILLOOP_NONE]: "",
  [Failloop.FAILLOOP_LOW_BATTERY]: "low battery at powerup - currently unused",
  [Failloop.FAILLOOP_RADIO]: "radio chip not found",
  [Failloop.FAILLOOP_GYRO]: "gyro not found",
  [Failloop.FAILLOOP_FAULT]:
    "clock, intterrupts, systick, gcc bad code, bad memory access (code issues like bad pointers) - this should not come up",
  [Failloop.FAILLOOP_LOOPTIME]: "loop time issue - if loop time exceeds 20mS",
  [Failloop.FAILLOOP_SPI]: "spi error  - triggered by hardware spi driver only",
  [Failloop.FAILLOOP_SPI_MAIN]:
    "spi error main loop  - triggered by hardware spi driver only",
};

export const useConstantStore = defineStore("constant", {
  state: () => ({
    Features,
    GyroType,
    GyroRotation,
    AuxChannels,
    RXSerialProtocol,
    StickWizardState,
    Failloop,
  }),
  getters: {
    RXProtocol() {
      const info = useInfoStore();

      if (semver.gt(info.quic_protocol_semver, "0.1.0")) {
        return RXProtocolV011;
      }
      if (info.quic_protocol_version > 5) {
        return RXProtocolV010;
      }
      return RXProtocolV5;
    },
    AuxFunctions() {
      const info = useInfoStore();

      if (semver.gt(info.quic_protocol_semver, "0.1.0")) {
        return AuxFunctionsV011;
      }
      return AuxFunctionsV010;
    },
  },
  actions: {},
});

// These should align with 'blackbox_t' and 'blackbox_field_t' in Quicksilver source 'blackbox.h'
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
  MOTOR,
  CPU_LOAD,
  DEBUG,
}
