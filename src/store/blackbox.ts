import { defineStore } from "pinia";
import { useRootStore } from "./root";
import { QuicBlackbox, QuicCmd } from "./serial/quic";
import { serial } from "./serial/serial";
import { Blackbox } from "./util/blackbox";

export const useBlackboxStore = defineStore("blackbox", {
  state: () => ({
    busy: false,
    speed: undefined as number | undefined,
    progress: undefined as number | undefined,
    list: { flash_size: 0, files: [] as { size: number }[] },
  }),
  actions: {
    reset_blackbox() {
      const root = useRootStore();

      return serial
        .command(QuicCmd.Blackbox, QuicBlackbox.Reset)
        .then(() => {
          root.append_alert({
            type: "success",
            msg: "Blackbox successfully reset",
          });
        })
        .catch((err) => {
          root.append_alert({ type: "danger", msg: err });
        });
    },
    list_blackbox() {
      return serial
        .command(QuicCmd.Blackbox, QuicBlackbox.List)
        .then((p) => (this.list = p.payload[0]));
    },
    download_blackbox_raw(index) {
      return serial
        .command(QuicCmd.Blackbox, QuicBlackbox.Get, index)
        .then((p) => {
          const encoded = encodeURIComponent(JSON.stringify(p.payload));
          return "data:text/json;charset=utf-8," + encoded;
        });
    },
    download_blackbox(index) {
      const root = useRootStore();
      const file = this.list.files[index];

      const start = performance.now();
      return serial
        .commandProgress(
          QuicCmd.Blackbox,
          (v: number) => {
            const delta = (performance.now() - start) / 1000;
            this.progress = v / file.size;
            this.speed = v / delta;
          },
          QuicBlackbox.Get,
          index
        )
        .then((p) => {
          const writer = new Blackbox(file);
          writer.writeHeaders();
          for (const v of p.payload) {
            writer.writeValue(v);
          }
          return writer.toUrl();
        })
        .then((url) => {
          root.append_alert({
            type: "success",
            msg: "Blackbox successfully downloaded!",
          });
          return url;
        })
        .catch((err) => {
          root.append_alert({
            type: "danger",
            msg: "Blackbox download failed",
          });
          throw err;
        })
        .finally(() => {
          this.progress = undefined;
          this.speed = undefined;
        });
    },
  },
});
