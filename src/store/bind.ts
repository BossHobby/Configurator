import { serial } from "./serial/serial";
import { QuicVal } from "./serial/quic";
import { Log } from "@/log";
import { defineStore } from "pinia";
import { useRootStore } from "./root";

export const useBindStore = defineStore("bind", {
  state: () => ({
    info: {
      bind_saved: 0,
    },
  }),
  actions: {
    fetch_bind_info() {
      return serial.get(QuicVal.BindInfo).then((b) => (this.info = b));
    },
    apply_bind_info(info) {
      const root = useRootStore();

      return (
        serial
          .set(QuicVal.BindInfo, info)
          .then((b) => (this.info = b))
          // .then((b) => commit("track_key_change", "bind.info"))
          .then(() =>
            root.append_alert({ type: "success", msg: "Bind info applied!" })
          )
          .catch((err) => {
            Log.error(err);
            root.append_alert({
              type: "danger",
              msg: "Apply failed! " + err,
            });
          })
      );
    },
  },
});
