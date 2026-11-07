import semver from "semver";
import { decodeSemver } from ".";
import {
  output_source_t,
  type aux_function_map_t,
  type target_t,
} from "../types";
import { OSD } from "./osd";
import { migrateReceiverV031 } from "./receiver";

// Profile format migration, kept apart from the profile store so the command
// line client can run it. Callers pass the board's default profile, which
// carries the firmware's profile version, and its target.

export const DEFAULT_MOTOR = {
  digital_idle: 4.5,
};

const OSD_CRSF_TX_POWER_ELEMENT = 18;

export function fixedMotorMixer(propsOut) {
  const sources = [
    output_source_t.OUTPUT_SOURCE_ROLL,
    output_source_t.OUTPUT_SOURCE_PITCH,
    output_source_t.OUTPUT_SOURCE_YAW,
  ];
  const weights = [
    [100, 100, propsOut ? -100 : 100],
    [100, -100, propsOut ? 100 : -100],
    [-100, 100, propsOut ? 100 : -100],
    [-100, -100, propsOut ? -100 : 100],
  ];

  return weights.flatMap((motorWeights, outputIndex) =>
    sources.map((source, sourceIndex) => ({
      output_index: outputIndex,
      source,
      source_index: 0,
      weight: motorWeights[sourceIndex],
    })),
  );
}

export function mergeFixedMotorMixer(mixer, propsOut) {
  const fixedRules = fixedMotorMixer(propsOut);
  const sources = new Set(fixedRules.map((rule) => rule.source));

  return [
    ...(mixer || []).filter(
      (rule) => rule.output_index >= 4 || !sources.has(rule.source),
    ),
    ...fixedRules,
  ];
}

export function mergeDeep(target, source) {
  for (const [key, val] of Object.entries(source)) {
    if (val !== null && typeof val === `object`) {
      if (target[key] === undefined) {
        target[key] = new (val as any).__proto__.constructor();
      }
      mergeDeep(target[key], val);
    } else {
      target[key] = val;
    }
  }
  // we're replacing in-situ, so this is more for chaining than anything else
  return target;
}

function makeSemver(major: number, minor: number, patch: number) {
  return (major << 16) | (minor << 8) | patch;
}

export function cloneProfileValue(value: any): any {
  if (value instanceof Uint8Array) {
    return new Uint8Array(value);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => cloneProfileValue(entry));
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        cloneProfileValue(entry),
      ]),
    );
  }
  return value;
}

function bytesFromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function coerceProfileByteStrings(profile: any) {
  const raw = profile.receiver?.bind?.raw;
  if (typeof raw === "string") {
    profile.receiver.bind.raw = bytesFromBase64(raw);
  } else if (Array.isArray(raw)) {
    profile.receiver.bind.raw = Uint8Array.from(raw);
  }
}

function ensureMinVersion(version): number {
  version = version || makeSemver(0, 1, 0);
  if (version < makeSemver(0, 1, 0)) {
    version = makeSemver(0, 1, 0);
  }
  return version;
}

function migrateCrsfTxPowerOsdElement(elements, defaultElements) {
  const migrated = [...(Array.isArray(elements) ? elements : [])];
  while (migrated.length <= OSD_CRSF_TX_POWER_ELEMENT) {
    migrated.push(0);
  }
  migrated[OSD_CRSF_TX_POWER_ELEMENT] =
    defaultElements?.[OSD_CRSF_TX_POWER_ELEMENT] ?? 0;
  return migrated;
}

export function migrateProfileVersion(
  profile,
  target: target_t,
  default_profile,
  profileVersion: string,
  firmwareVersion: string,
) {
  if (profile.meta.name) {
    profile.meta.name = profile.meta.name.replace(/\0/g, "");
  }
  if (profile.osd?.callsign) {
    profile.osd.callsign = profile.osd.callsign.replace(/\0/g, "");
  }
  profile.wing = {
    ...(default_profile.wing || {}),
    ...(profile.wing || {}),
  };
  profile.navigation = {
    ...(default_profile.navigation || {}),
    ...(profile.navigation || {}),
  };

  // Steps below convert only the sections a profile carries: template
  // patches hold a few fields and are migrated through this chain too.
  if (semver.eq(profileVersion, "v0.1.0") && profile.rate) {
    const silverware = {
      mode: 0,
      rate: [
        profile.rate.silverware?.max_rate || [860, 860, 500],
        profile.rate.silverware?.acro_expo || [0.8, 0.8, 0.6],
        profile.rate.silverware?.angle_expo || [0.55, 0, 0.55],
      ],
    };
    const betaflight = {
      mode: 1,
      rate: [
        profile.rate.betaflight?.rc_rate || [1.3, 1.3, 1.3],
        profile.rate.betaflight?.super_rate || [0.7, 0.7, 0.7],
        profile.rate.betaflight?.expo || [0.4, 0.4, 0.4],
      ],
    };

    profile.rate.profile = 0;

    if (profile.rate.mode == 0) {
      profile.rate.rates = [silverware, betaflight];
    } else {
      profile.rate.rates = [betaflight, silverware];
    }
  }

  if (
    semver.lt(profileVersion, "v0.2.2") &&
    semver.gte(firmwareVersion, "v0.2.2") &&
    profile.serial
  ) {
    const serial_ports = target.serial_ports.filter((p) => p.index != 0);
    for (const key of Object.keys(profile.serial)) {
      if (profile.serial[key] == 0) {
        continue;
      }
      if (profile.serial[key] <= serial_ports.length) {
        profile.serial[key] = serial_ports[profile.serial[key] - 1].index;
      } else {
        profile.serial[key] = profile.serial[key] - serial_ports.length + 100;
      }
    }
  }

  if (semver.lte(profileVersion, "v0.2.4") && profile.osd?.elements?.length) {
    const elements: any[] = [];

    for (let i = 0; i < profile.osd.elements.length; i++) {
      const element_sd = profile.osd.elements[i];
      const element_hd = profile.osd.elements_hd[i];

      let element = 0;
      element |= OSD.elementEncode(
        element,
        "active",
        OSD.elementDecodeLegacy(element_sd, "active"),
      );
      element |= OSD.elementEncode(
        element,
        "invert",
        OSD.elementDecodeLegacy(element_sd, "invert"),
      );
      element |= OSD.elementEncode(
        element,
        "pos_sd_x",
        OSD.elementDecodeLegacy(element_sd, "pos_x"),
      );
      element |= OSD.elementEncode(
        element,
        "pos_sd_y",
        OSD.elementDecodeLegacy(element_sd, "pos_y"),
      );
      element |= OSD.elementEncode(
        element,
        "pos_hd_x",
        OSD.elementDecodeLegacy(element_hd, "pos_x"),
      );
      element |= OSD.elementEncode(
        element,
        "pos_hd_y",
        OSD.elementDecodeLegacy(element_hd, "pos_y"),
      );
      elements.push(element);
    }

    profile.osd.profiles = [
      { callsign: profile.osd.callsign, elements },
      { callsign: profile.osd.callsign, elements },
    ];
  }

  if (
    semver.lt(profileVersion, "v0.2.7") &&
    semver.gte(firmwareVersion, "v0.2.7") &&
    profile.filter &&
    "dterm_dynamic_enable" in profile.filter
  ) {
    profile.filter.dterm_dynamic_type = profile.filter.dterm_dynamic_enable
      ? 1
      : 0;
  }

  if (
    semver.lt(profileVersion, "v0.3.0") &&
    semver.gte(firmwareVersion, "v0.3.0")
  ) {
    const propsOut = Boolean(profile.motor?.invert_yaw);
    profile.mixer = fixedMotorMixer(propsOut);

    if (Array.isArray(profile.receiver?.aux)) {
      profile.receiver.aux = profile.receiver.aux.map((entry) => {
        if (typeof entry === "number") {
          const isOff = entry === 12;
          const isOn = entry === 13;
          return {
            channel: 4 + entry,
            range_min: isOff || isOn ? 0 : 32768,
            range_max: 65535,
          } as aux_function_map_t;
        }
        return entry;
      });
    }
  }

  if (
    semver.lt(profileVersion, "v0.3.1") &&
    semver.gte(firmwareVersion, "v0.3.1") &&
    Array.isArray(profile.osd?.profiles)
  ) {
    profile.osd.profiles = profile.osd.profiles.map((osdProfile, index) => ({
      ...osdProfile,
      elements: migrateCrsfTxPowerOsdElement(
        osdProfile?.elements,
        default_profile.osd?.profiles?.[index]?.elements,
      ),
    }));
  }

  if (
    semver.lt(profileVersion, "v0.3.1") &&
    semver.gte(firmwareVersion, "v0.3.1") &&
    profile.receiver
  ) {
    profile.receiver = migrateReceiverV031(profile.receiver);
  }

  if (
    semver.lt(profileVersion, "v0.3.0") &&
    semver.gte(firmwareVersion, "v0.3.1") &&
    Array.isArray(profile.receiver?.aux)
  ) {
    // Released profiles are multirotor. Keep inverse serial pit-mode behavior;
    // new GPIO assignments use firmware defaults because the old AUX has no pin identity.
    const fpv = profile.receiver.aux[11] as aux_function_map_t;
    const aux = (default_profile.receiver.aux as aux_function_map_t[]).map(
      (entry) => ({ ...entry }),
    );
    for (let i = 0; i < Math.min(profile.receiver.aux.length, 16); i++)
      aux[i] = profile.receiver.aux[i];
    profile.receiver.aux = aux;
    if (fpv) {
      profile.receiver.aux[11] =
        fpv.channel < 16
          ? { channel: fpv.channel, range_min: 0, range_max: 32767 }
          : { channel: 16, range_min: 0, range_max: 0 };
    }
  }

  return profile;
}

/**
 * Converts a profile read from a file or an older board to the format of the
 * firmware the default profile comes from, filling in sections it lacks.
 */
export function migrateProfile(profile, default_profile, target: target_t) {
  const firmwareVersion = ensureMinVersion(default_profile?.meta?.version);
  const profileVersion = ensureMinVersion(profile?.meta?.version);

  let p = cloneProfileValue(profile);
  if (!p.meta) {
    p.meta = {};
  }
  coerceProfileByteStrings(p);
  if (firmwareVersion != profileVersion) {
    p = migrateProfileVersion(
      p,
      target,
      default_profile,
      decodeSemver(profileVersion),
      decodeSemver(firmwareVersion),
    );
  }

  p.filter = {
    ...(default_profile.filter || {}),
    ...(p.filter || {}),
  };
  p.motor = {
    ...DEFAULT_MOTOR,
    ...(default_profile.motor || {}),
    ...(p.motor || {}),
  };
  p.wing = {
    ...(default_profile.wing || {}),
    ...(p.wing || {}),
  };

  if (Array.isArray(p.receiver?.role_map)) {
    p.receiver.role_map = p.receiver.role_map.map((map: any) => ({
      channel: map?.channel ?? 0,
      min: map?.min ?? -1,
      center: map?.center ?? 0,
      max: map?.max ?? 1,
    }));
  }

  p.meta.datetime = Math.floor(Date.now() / 1000);

  return p;
}

function isPlainObject(value: any): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Uint8Array)
  );
}

// The migrated fields that come from the template: everything it set, plus
// whatever migration converted out of it. Defaults the migration fills in
// match the same migration of an empty patch and are left out.
function templateFields(migrated: any, baseline: any, template: any): any {
  const result = {};
  for (const [key, value] of Object.entries(migrated)) {
    const set = isPlainObject(template) && key in template;
    if (set && isPlainObject(value) && isPlainObject(template[key])) {
      result[key] = templateFields(value, baseline?.[key], template[key]);
    } else if (
      set ||
      JSON.stringify(value) !== JSON.stringify(baseline?.[key])
    ) {
      result[key] = value;
    }
  }
  return result;
}

// Templates are partial profiles for the firmware version in their meta.
// Migrate them so older formats convert, but merge only their own fields:
// a full migration also adds defaults (filter, motor, wing, navigation and a
// multirotor mixer) that would replace the board's values. The version stays
// the board's, so the merged profile is not migrated again as an old one.
// Templates without a version are taken as current.
export function migrateTemplatePatch(
  template: any,
  default_profile,
  target: target_t,
): any {
  const version = template?.meta?.version;
  let fields = cloneProfileValue(template);
  if (version) {
    const meta = { version };
    fields = templateFields(
      migrateProfile(template, default_profile, target),
      migrateProfile({ meta }, default_profile, target),
      template,
    );
  }
  if (fields.meta) {
    delete fields.meta.version;
    delete fields.meta.datetime;
    delete fields.meta.firmware;
  }
  coerceProfileByteStrings(fields);
  return fields;
}
