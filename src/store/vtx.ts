import { QuicVal } from "./serial/quic";
import { serial } from "./serial/serial";
import { defineStore } from "pinia";
import { useRootStore } from "./root";

export const useVTXStore = defineStore("vtx", {
  state: () => ({
    settings: {
      protocol: 0,
      detected: 0,
      channel: 0,
      band: 0,
    },
  }),
  actions: {
    apply_vtx_settings(vtx_settings) {
      const root = useRootStore();

      return serial
        .set(QuicVal.VtxSettings, vtx_settings)
        .then((v) => (this.settings = v))
        .then(() => {
          root.append_alert({ type: "success", msg: "Apply successful!" });
        })
        .catch(() => {
          root.append_alert({ type: "danger", msg: "Apply failed" });
        });
    },
    update_vtx_settings() {
      if (this.settings.detected == 0) {
        return serial.get(QuicVal.VtxSettings).then((settings) => {
          const protocol =
            settings.detected == 0 ? this.settings.protocol : settings.protocol;
          this.settings = {
            ...settings,
            protocol,
          };
        });
      }
    },
  },
});
