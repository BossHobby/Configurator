import { QuicVal } from "./serial/quic";
import { serial } from "./serial/serial";
import { defineStore } from "pinia";

interface GpsConstellation {
  enabled: number;
  healthy: number;
  sats_in_view: number;
  sats_used: number;
}

interface GpsStatus {
  state: number;
  fix_type: number;
  fix_quality: number;
  sats_in_view: number;
  sats_used: number;
  gps: GpsConstellation;
  glonass: GpsConstellation;
  galileo: GpsConstellation;
  beidou: GpsConstellation;
  pdop: number;
  h_acc: number;
  v_acc: number;
  update_rate: number;
  avg_cno: number;
  power_mode: number;
}

export const useGpsStore = defineStore("gps", {
  state: (): GpsStatus => ({
    state: 0,
    fix_type: 0,
    fix_quality: 0,
    sats_in_view: 0,
    sats_used: 0,
    gps: {
      enabled: 0,
      healthy: 0,
      sats_in_view: 0,
      sats_used: 0,
    },
    glonass: {
      enabled: 0,
      healthy: 0,
      sats_in_view: 0,
      sats_used: 0,
    },
    galileo: {
      enabled: 0,
      healthy: 0,
      sats_in_view: 0,
      sats_used: 0,
    },
    beidou: {
      enabled: 0,
      healthy: 0,
      sats_in_view: 0,
      sats_used: 0,
    },
    pdop: 0,
    h_acc: 0,
    v_acc: 0,
    update_rate: 0,
    avg_cno: 0,
    power_mode: 0,
  }),
  getters: {
    configStateName(state) {
      const CONFIG_STATES = {
        0: "Detecting Baud",
        1: "Changing Baud",
        2: "Checking Performance",
        3: "Configuring Constellations",
        4: "Configuring Ground Assist",
        5: "Configuring Rate",
        6: "Configuring NAV5",
        7: "Configuring SBAS",
        8: "Waiting for Lock",
        9: "Running",
        10: "Not Detected",
      };
      return CONFIG_STATES[state.state] || "Unknown";
    },
    fixTypeName(state) {
      const FIX_TYPES = {
        0: "No Fix",
        1: "Dead Reckoning",
        2: "2D Fix",
        3: "3D Fix",
        4: "GNSS + DR",
        5: "Time Only",
      };
      return FIX_TYPES[state.fix_type] || "Unknown";
    },
    powerModeName(state) {
      const POWER_MODES = {
        0: "Full Power",
        1: "Balanced",
        2: "Low Power",
        255: "Unknown",
      };
      return POWER_MODES[state.power_mode] || "Unknown";
    },
    totalSatsUsed(state) {
      return (
        state.gps.sats_used +
        state.glonass.sats_used +
        state.galileo.sats_used +
        state.beidou.sats_used
      );
    },
    activeConstellations(state) {
      const active: string[] = [];
      if (state.gps.enabled && state.gps.sats_in_view > 0) active.push("GPS");
      if (state.glonass.enabled && state.glonass.sats_in_view > 0)
        active.push("GLONASS");
      if (state.galileo.enabled && state.galileo.sats_in_view > 0)
        active.push("Galileo");
      if (state.beidou.enabled && state.beidou.sats_in_view > 0)
        active.push("BeiDou");
      return active;
    },
  },
  actions: {
    async poll_serial() {
      const update = await serial.get(QuicVal.GpsStatus);
      this.$patch(update);
    },
  },
});
