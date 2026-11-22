import YAML from "yaml";
import { profileToYaml } from "./profile-yaml.ts";

// Every profile read from a board is kept in IndexedDB, so an overwrite,
// reset or bad import can be undone. Backups are grouped by craft: the
// board's chip uid where the firmware sends one, else its target and MCU.

export interface ProfileBackup {
  id?: number;
  craft: string;
  target: string;
  name: string;
  firmware: string;
  saved: number; // ms since epoch
  // Identifies the profile's settings; one backup per hash and craft.
  hash: string;
  yaml: string;
}

export interface BackupStore {
  // Newest first.
  list(craft: string): Promise<ProfileBackup[]>;
  add(backup: ProfileBackup): Promise<void>;
  delete(id: number): Promise<void>;
}

export interface CraftInfo {
  uid?: Uint8Array;
  target_name: string;
  mcu: string;
  git_version: string;
}

// Backups kept per craft; older ones are deleted.
const KEEP = 20;

export function uidHex(uid?: Uint8Array): string | undefined {
  if (!(uid instanceof Uint8Array) || !uid.length) return undefined;
  return [...uid].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function craftKey(info: CraftInfo): string {
  return uidHex(info.uid) ?? `${info.target_name}@${info.mcu}`;
}

const FNV64_OFFSET = 0xcbf29ce484222325n;
const FNV64_PRIME = 0x100000001b3n;
const MASK64 = (1n << 64n) - 1n;

// FNV-1a over the settings. Saving stamps meta.datetime and meta.firmware,
// so a reflash alone does not change the hash.
// Hashing the parsed .yaml covers the bind bytes as the export stores them.
export function profileHash(yaml: string): string {
  const profile = YAML.parse(yaml);
  if (profile?.meta) {
    delete profile.meta.datetime;
    delete profile.meta.firmware;
  }
  let hash = FNV64_OFFSET;
  for (const byte of new TextEncoder().encode(JSON.stringify(profile))) {
    hash = ((hash ^ BigInt(byte)) * FNV64_PRIME) & MASK64;
  }
  return hash.toString(16).padStart(16, "0");
}

export class ProfileBackups {
  private store: Promise<BackupStore | undefined>;
  private now: () => number;
  // Records run in order, so deduplication sees the previous one.
  private queue: Promise<unknown> = Promise.resolve();

  constructor(store: Promise<BackupStore | undefined>, now = () => Date.now()) {
    // Without storage there are no backups, but nothing else breaks.
    this.store = store.catch(() => undefined);
    this.now = now;
  }

  // Serializes the profile right away, so later changes to it are not saved.
  record(info: CraftInfo, profile: any): Promise<void> {
    const yaml = profileToYaml(profile);
    const backup: ProfileBackup = {
      craft: craftKey(info),
      target: info.target_name,
      name: String(profile?.meta?.name ?? "").replace(/\0/g, ""),
      firmware: info.git_version,
      saved: this.now(),
      hash: profileHash(yaml),
      yaml,
    };
    const run = this.queue.then(() => this.add(backup));
    this.queue = run.catch(() => undefined);
    return run;
  }

  async list(info: CraftInfo): Promise<ProfileBackup[]> {
    await this.queue;
    const store = await this.store;
    if (!store) return [];
    return store.list(craftKey(info));
  }

  async delete(id: number) {
    await (await this.store)?.delete(id);
  }

  private async add(backup: ProfileBackup) {
    const store = await this.store;
    if (!store) return;
    const backups = await store.list(backup.craft);
    // A profile already kept, even an earlier one returned to, keeps the
    // time it was first saved.
    if (backups.some((b) => b.hash == backup.hash)) return;
    await store.add(backup);
    for (const old of backups.slice(KEEP - 1)) {
      await store.delete(old.id!);
    }
  }
}

const STORE = "backups";
const BY_CRAFT = "by-craft";

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function openBackupStore(
  name = "profile-backups",
): Promise<BackupStore | undefined> {
  if (typeof indexedDB == "undefined") return undefined;
  const open = indexedDB.open(name, 1);
  open.onupgradeneeded = () => {
    const backups = open.result.createObjectStore(STORE, {
      keyPath: "id",
      autoIncrement: true,
    });
    backups.createIndex(BY_CRAFT, ["craft", "saved"]);
  };
  const db = await request(open);
  const tx = (mode: IDBTransactionMode) =>
    db.transaction(STORE, mode).objectStore(STORE);

  return {
    list: async (craft) => {
      const range = IDBKeyRange.bound([craft, -Infinity], [craft, Infinity]);
      const all = await request(tx("readonly").index(BY_CRAFT).getAll(range));
      return all.reverse();
    },
    add: async (backup) => {
      await request(tx("readwrite").add(backup));
    },
    delete: async (id) => {
      await request(tx("readwrite").delete(id));
    },
  };
}

// One set of backups for the app, opened on first use.
let shared: ProfileBackups | undefined;
export function profileBackups() {
  shared ??= new ProfileBackups(openBackupStore());
  return shared;
}
