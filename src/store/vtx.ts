import { QuicVal } from "./serial/quic";
import { serial } from "./serial/serial";
import { defineStore } from "pinia";
import { useInfoStore } from "./info";

const PROFILE_VTX_SETTINGS_VERSION = "0.2.9";

function normalizeVtxStatus(status) {
  return {
    ...status,
    protocol: status.detected ?? status.protocol,
  };
}

function useProfileVtxSettings() {
  const info = useInfoStore();
  return info.quic_semver_gte(PROFILE_VTX_SETTINGS_VERSION);
}

export const useVTXStore = defineStore("vtx", {
  state: () => ({
    status: {
      protocol: 0,
      channel: 0,
      band: 0,
      pit_mode: 0,
      power_level: 0,
      power_table: {
        levels: 0,
        labels: [],
        values: [],
      },
    },
    legacy_settings: {
      protocol: 0,
      channel: 0,
      band: 0,
      pit_mode: 0,
      power_level: 0,
      power_table: {
        levels: 0,
        labels: [],
        values: [],
      },
    },
  }),
  actions: {
    apply_legacy_settings(vtx_settings) {
      return serial.set(QuicVal.VtxSettings, vtx_settings).then((v) => {
        this.legacy_settings = v;
        this.status = normalizeVtxStatus(v);
      });
    },
    update_status(force = false) {
      if (useProfileVtxSettings()) {
        return serial.get(QuicVal.VtxSettings).then((status) => {
          this.status = normalizeVtxStatus(status);
        });
      }
      if (this.status.protocol == 0 || force) {
        return serial.get(QuicVal.VtxSettings).then((settings) => {
          const protocol = this.legacy_settings.protocol || settings.protocol;
          this.legacy_settings = {
            ...settings,
            protocol,
          };
          this.status = normalizeVtxStatus(settings);
        });
      }
    },
  },
});
