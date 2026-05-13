import { CBOR } from "./serial/cbor";
import { Blackbox } from "./util/blackbox";
import { CompressedBlackboxDecoder } from "./util/blackbox-compressed";
import {
  blackboxScaleForFirmware,
  transformBlackboxFieldFlags,
} from "./util/blackbox-shared";
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
  const values = CBOR.decode(new Uint8Array(request.payload));
  const profile = isProfile(values[0])
    ? (values.shift() as profile_t)
    : undefined;
  const decoder = new CompressedBlackboxDecoder(
    request.firmwareVersion,
    request.file,
  );

  return {
    profile,
    entries: decoder.decode(values),
    compressed: decoder.useCompression,
  };
}

function isProfile(value: unknown): value is profile_t {
  return (
    !!value && typeof value == "object" && "meta" in value && "motor" in value
  );
}

self.onmessage = (event: MessageEvent<BlackboxWorkerRequest>) => {
  const request = event.data;

  try {
    const { profile, entries, compressed } = decodeFrames(request);
    let blob: Blob;

    if (request.format == "json") {
      blob = new Blob(
        [
          JSON.stringify({
            ...request.file,
            fields: request.fields?.map((field, index) => {
              const value = entries[0]?.[index];
              if (field.name === "debug" && Array.isArray(value)) {
                return {
                  ...field,
                  axis: value.map((_, channel) => channel.toString()),
                };
              }
              return field;
            }),
            entries,
            compressed,
            firmwareVersion: request.firmwareVersion,
            profile,
          }),
        ],
        { type: "application/json" },
      );
    } else {
      const btflProfile = profile ?? request.profile;
      if (!btflProfile) {
        throw new Error("missing profile");
      }

      const writer = new Blackbox(
        {
          ...request.file,
          field_flags: transformBlackboxFieldFlags(
            request.file.field_flags,
            request.firmwareVersion,
          ),
        },
        blackboxScaleForFirmware(request.firmwareVersion),
      );
      writer.writeHeaders(btflProfile);
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
