import { exportBlackboxBtfl, exportBlackboxJson } from "./util/blackbox-export";
import type { BlackboxFile } from "./util/blackbox-shared";
import type { profile_t } from "./types";

type BlackboxWorkerRequest = {
  id: number;
  format: "json" | "btfl";
  payload: ArrayBuffer;
  file: BlackboxFile;
  firmwareVersion: string;
  profile?: profile_t;
};

self.onmessage = (event: MessageEvent<BlackboxWorkerRequest>) => {
  const request = event.data;
  const payload = new Uint8Array(request.payload);

  try {
    const blob =
      request.format == "json"
        ? new Blob(
            [
              exportBlackboxJson(
                payload,
                request.file,
                request.firmwareVersion,
              ),
            ],
            { type: "application/json" },
          )
        : new Blob(
            [
              exportBlackboxBtfl(
                payload,
                request.file,
                request.firmwareVersion,
                request.profile,
              ) as Uint8Array<ArrayBuffer>,
            ],
            { type: "octet/stream" },
          );

    self.postMessage({ id: request.id, blob });
  } catch (err) {
    self.postMessage({
      id: request.id,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
