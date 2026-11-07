import { CBOR } from "../serial/cbor";
import type { profile_t } from "../types";
import { Blackbox } from "./blackbox";
import { CompressedBlackboxDecoder } from "./blackbox-compressed";
import {
  blackboxFieldDefs,
  blackboxScaleForFirmware,
  transformBlackboxFieldFlags,
  type BlackboxFile,
} from "./blackbox-shared";

// Converts a QuicBlackbox.Get reply into the configurator's export formats.
// Shared by the blackbox worker and the command line client.

function decodeFrames(
  payload: Uint8Array,
  file: BlackboxFile,
  firmwareVersion: string,
) {
  const values = CBOR.decode(payload);
  const profile = isProfile(values[0])
    ? (values.shift() as profile_t)
    : undefined;
  const decoder = new CompressedBlackboxDecoder(firmwareVersion, file);

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

export function exportBlackboxJson(
  payload: Uint8Array,
  file: BlackboxFile,
  firmwareVersion: string,
): string {
  const { profile, entries, compressed } = decodeFrames(
    payload,
    file,
    firmwareVersion,
  );
  return JSON.stringify({
    ...file,
    fields: blackboxFieldDefs(file.field_flags, firmwareVersion).map(
      (field, index) => {
        const value = entries[0]?.[index];
        if (field.name === "debug" && Array.isArray(value)) {
          return {
            ...field,
            axis: value.map((_, channel) => channel.toString()),
          };
        }
        return field;
      },
    ),
    entries,
    compressed,
    firmwareVersion,
    profile,
  });
}

/**
 * Writes a Betaflight blackbox log. Files recorded without an embedded
 * profile take the given one for their headers.
 */
export function exportBlackboxBtfl(
  payload: Uint8Array,
  file: BlackboxFile,
  firmwareVersion: string,
  fallbackProfile?: profile_t,
): Uint8Array {
  const { profile, entries } = decodeFrames(payload, file, firmwareVersion);
  const btflProfile = profile ?? fallbackProfile;
  if (!btflProfile) {
    throw new Error("missing profile");
  }

  const writer = new Blackbox(
    {
      ...file,
      field_flags: transformBlackboxFieldFlags(
        file.field_flags,
        firmwareVersion,
      ),
    },
    blackboxScaleForFirmware(firmwareVersion),
  );
  writer.writeHeaders(btflProfile);
  for (const v of entries) {
    writer.writeValue(v);
  }
  return writer.array();
}
