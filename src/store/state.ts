import { QuicVal } from "./serial/quic";
import { serial } from "./serial/serial";
import { Log } from "@/log";
import { FailloopMessages } from "./constants";
import { defineStore } from "pinia";

export const useStateStore = defineStore("state", {
  state: () => ({
    looptime_autodetect: 0,
    cpu_load: 0.0,
    cpu_temp: 0.0,
    vbat_filtered: 0.0,
    vbattfilt: null,
    ibat_filtered: 0.0,
    ibat_drawn: 0.0,
    rx: [],
    rx_filtered: [],
    rx_channels: [],
    rx_status: 0,
    rx_protocol: 0,
    rx_rssi: 0,
    gyro_temp: 0,
    GEstG: null,
    accel: null,
    angle_error: [],
    stick_vector: [],
    aux: [],
    stick_calibration_wizard: 0,
    failloop: 0,
    pidoutput: null,
    accel_raw: null,
    gyro: null,
    gyro_raw: null,
    altitude: 0,
    gps_version: 0,
    // Receiver status; jamming and spoofing as the firmware's gps_jamming_t
    // and gps_spoofing_t.
    gps_health: { lock: false, jamming: 0, spoofing: 0 },
    gps_sats: 0,
    gps_speed: 0,
    gps_velocity: [0, 0, 0], // m/s north, east, up
    gps_accel: [0, 0], // m/s^2 north, east
    gps_heading: 0,
    gps_heading_accuracy: 0,
    gps_horizontal_accuracy: 0,
    gps_last_update_ms: 0,
    gps_coord: { lon: 0, lat: 0 },
    position: { lon: 0, lat: 0 }, // navigation's estimate; the map shows it
    home: { lon: 0, lat: 0 },
    gps_altitude: 0,
    heading: 0,
    heading_confidence: 0,
    heading_correction_flags: 1,
    home_bearing: 0,
    home_distance: 0,
    attitude: [],
  }),
  getters: {
    vbat(state) {
      return state.vbattfilt || state.vbat_filtered;
    },
    failloopMessage(state) {
      return FailloopMessages[state.failloop];
    },
  },
  actions: {
    fetch_state() {
      return serial
        .get(QuicVal.State)
        .then((update) => this.$patch(update))
        .catch((err) => Log.warn("state", err));
    },
  },
});
