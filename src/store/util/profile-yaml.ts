import YAML from "yaml";

// The profile .yaml export, shared by the profile panel and the command line
// client. The receiver bind bytes are stored as base64.

function bindRawToBase64(raw: unknown): string | unknown {
  if (!(raw instanceof Uint8Array)) {
    return raw;
  }

  let binary = "";
  for (const byte of raw) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function profileToYaml(profile: any): string {
  const yamlProfile = structuredClone(profile);
  const bind = yamlProfile.receiver?.bind;
  if (bind?.raw) {
    bind.raw = bindRawToBase64(bind.raw);
  }
  return YAML.stringify(yamlProfile);
}

export function profileFilename(profile: any): string {
  const date = new Date(profile.meta.datetime * 1000)
    .toISOString()
    .substring(0, 10);
  const name = profile.meta.name.replace(/\0/g, "");
  return `Profile_${name}_${date}.yaml`;
}
