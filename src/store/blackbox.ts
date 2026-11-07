import { defineStore } from "pinia";
import { useRootStore } from "./root";
import { QuicBlackbox, QuicCmd, QuicVal } from "./serial/quic";
import { serial } from "./serial/serial";
import type { BlackboxFile } from "./util/blackbox-shared";
import { useProfileStore } from "./profile";
import { useInfoStore } from "./info";
import type { profile_t } from "./types";

type BlackboxWorkerFormat = "json" | "btfl";

let blackboxWorkerRequestId = 0;

function processBlackboxInWorker(
  format: BlackboxWorkerFormat,
  payload: Uint8Array,
  file: BlackboxFile,
  firmwareVersion: string,
  profile?: profile_t,
) {
  return new Promise<string>((resolve, reject) => {
    const worker = new Worker(
      new URL("./blackbox.worker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    const id = ++blackboxWorkerRequestId;

    worker.onmessage = (event) => {
      if (event.data.id != id) {
        return;
      }
      worker.terminate();

      if (event.data.error) {
        reject(new Error(event.data.error));
        return;
      }

      resolve(URL.createObjectURL(event.data.blob));
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(event.error ?? new Error(event.message));
    };

    const buffer = payload.buffer.slice(
      payload.byteOffset,
      payload.byteOffset + payload.byteLength,
    );
    const cloneableFile = { ...file };
    const cloneableProfile = profile
      ? (JSON.parse(JSON.stringify(profile)) as profile_t)
      : undefined;

    worker.postMessage(
      {
        id,
        format,
        payload: buffer,
        file: cloneableFile,
        firmwareVersion,
        profile: cloneableProfile,
      },
      [buffer],
    );
  });
}

export interface BlackboxPreset {
  field_flags: number;
  name: string;
  name_osd: string;
  sample_rate_hz: number;
}

export type { BlackboxFieldDef, BlackboxFile } from "./util/blackbox-shared";
export {
  BlackboxFieldUnit,
  BlackboxFields,
  blackboxFileDate,
  transformBlackboxFieldFlags,
} from "./util/blackbox-shared";

export const useBlackboxStore = defineStore("blackbox", {
  state: () => ({
    busy: false,
    speed: undefined as number | undefined,
    progress: undefined as number | undefined,
    list: { flash_size: 0, files: [] as BlackboxFile[] },
    presets: [] as BlackboxPreset[],
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
    fetch_presets() {
      return serial
        .get(QuicVal.BlackboxPresets)
        .then((val) => (this.presets = val));
    },
    download_blackbox_quic(index) {
      const root = useRootStore();
      const file = this.list.files[index];
      const info = useInfoStore();

      const start = performance.now();
      return serial
        .commandProgressRaw(
          QuicCmd.Blackbox,
          (v: number) => {
            const delta = (performance.now() - start) / 1000;
            this.progress = v / file.size;
            this.speed = v / delta;
          },
          QuicBlackbox.Get,
          index,
        )
        .then((p) =>
          processBlackboxInWorker(
            "json",
            p.payload,
            file,
            info.quic_protocol_semver,
          ),
        )
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
    download_blackbox_btfl(index) {
      const root = useRootStore();
      const file = this.list.files[index];
      const info = useInfoStore();

      const start = performance.now();
      return serial
        .commandProgressRaw(
          QuicCmd.Blackbox,
          (v: number) => {
            const delta = (performance.now() - start) / 1000;
            this.progress = v / file.size;
            this.speed = v / delta;
          },
          QuicBlackbox.Get,
          index,
        )
        .then((p) => {
          const profile = useProfileStore();

          return processBlackboxInWorker(
            "btfl",
            p.payload,
            file,
            info.quic_protocol_semver,
            JSON.parse(JSON.stringify(profile)) as profile_t,
          );
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
