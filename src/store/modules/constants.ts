import semver from "semver";

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

enum AuxFunctions {
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

const store = {
  namespaced: true,
  state: {
    Features,
    GyroRotation,
    AuxChannels,
    AuxFunctions,
    RXSerialProtocol,
    StickWizardState,
  },
  getters: {
    RXProtocol: (state, getters, rootState) => {
      if (semver.gt(rootState.info.quic_protocol_semver, "0.1.0")) {
        return RXProtocolV011;
      }
      if (rootState.info.quic_protocol_version > 5) {
        return RXProtocolV010;
      }
      return RXProtocolV5;
    },
  },
  mutations: {},
  actions: {},
};

export default store;
