import { CBOR } from "./serial/cbor";
import { Blackbox } from "./util/blackbox";
import { CompressedBlackboxDecoder } from "./util/blackbox-compressed";
import { blackboxScaleForFirmware } from "./util/blackbox-shared";
import type { BlackboxFieldDef } from "./blackbox";
import type { BlackboxFile } from "./util/blackbox-shared";
import type { profile_t } from "./types";

type BlackboxWorkerRequest = {
  id: number;
  format: "json" | "btfl";
  payload: ArrayBuffer;
  file: BlackboxFile;
  firmwareVersion: string;
  fields?: BlackboxFieldDef[];
  profile?: profile_t;
};

function decodeFrames(request: BlackboxWorkerRequest) {
  const frames = CBOR.decode(new Uint8Array(request.payload));
  const decoder = new CompressedBlackboxDecoder(
    request.firmwareVersion,
    request.file,
  );

  return {
    entries: decoder.decode(frames),
    compressed: decoder.useCompression,
  };
}

self.onmessage = (event: MessageEvent<BlackboxWorkerRequest>) => {
  const request = event.data;

  try {
    const { entries, compressed } = decodeFrames(request);
    let blob: Blob;

    if (request.format == "json") {
      blob = new Blob(
        [
          JSON.stringify({
            ...request.file,
            fields: request.fields,
            entries,
            compressed,
            firmwareVersion: request.firmwareVersion,
          }),
        ],
        { type: "application/json" },
      );
    } else {
      if (!request.profile) {
        throw new Error("missing profile");
      }

      const writer = new Blackbox(
        request.file,
        blackboxScaleForFirmware(request.firmwareVersion),
      );
      writer.writeHeaders(request.profile);
      for (const v of entries) {
        writer.writeValue(v);
      }
      blob = new Blob([writer.array()], { type: "octet/stream" });
    }

    self.postMessage({ id: request.id, blob });
  } catch (err) {
    self.postMessage({
      id: request.id,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
