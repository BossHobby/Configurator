import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ProfileBackups,
  craftKey,
  profileHash,
  uidHex,
} from "../src/store/util/profile-backup.ts";
import { profileToYaml } from "../src/store/util/profile-yaml.ts";

function memoryStore() {
  const entries = [];
  let next = 1;
  return {
    entries,
    list: async (craft) =>
      entries.filter((e) => e.craft == craft).sort((a, b) => b.saved - a.saved),
    add: async (backup) => void entries.push({ ...backup, id: next++ }),
    delete: async (id) => {
      const i = entries.findIndex((e) => e.id == id);
      if (i >= 0) entries.splice(i, 1);
    },
  };
}

const board = {
  uid: new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0, 1, 2, 3]),
  target_name: "MATEKF405",
  mcu: "stm32f405",
  git_version: "v0.3.0",
};

const profile = (name, datetime, kp = 1) => ({
  meta: { name, datetime },
  pid: { kp },
  receiver: { bind: { raw: new Uint8Array([1, 2, 3]) } },
});

test("crafts are matched by uid, else by target", () => {
  assert.equal(uidHex(board.uid), "deadbeef00010203");
  assert.equal(craftKey(board), "deadbeef00010203");
  assert.equal(craftKey({ ...board, uid: undefined }), "MATEKF405@stm32f405");
});

test("an unchanged profile is not kept twice", async () => {
  const store = memoryStore();
  let now = 1000;
  const backups = new ProfileBackups(Promise.resolve(store), () => now++);
  await backups.record(board, profile("quad", 1));
  await backups.record(board, profile("quad", 2));
  assert.equal(store.entries.length, 1);
  await backups.record(board, profile("quad", 3, 2));
  const list = await backups.list(board);
  assert.equal(list.length, 2);
  assert.match(list[0].yaml, /kp: 2/);
  assert.equal(list[0].name, "quad");
});

test("returning to an earlier profile keeps its first save", async () => {
  const store = memoryStore();
  let now = 1000;
  const backups = new ProfileBackups(Promise.resolve(store), () => now++);
  await backups.record(board, profile("quad", 1, 1));
  await backups.record(board, profile("quad", 2, 2));
  await backups.record(board, profile("quad", 3, 1));
  const list = await backups.list(board);
  assert.equal(list.length, 2);
  assert.match(list[0].yaml, /kp: 2\n/);
  assert.match(list[1].yaml, /kp: 1\n/);
  assert.equal(list[1].saved, 1000);
});

test("the hash ignores the save stamp but not the bind", () => {
  const yaml = (p) => profileToYaml(p);
  const reflashed = profile("quad", 2);
  reflashed.meta.firmware = "v0.3.1";
  assert.equal(
    profileHash(yaml(profile("quad", 1))),
    profileHash(yaml(reflashed)),
  );
  const rebound = profile("quad", 1);
  rebound.receiver.bind.raw = new Uint8Array([3, 2, 1]);
  assert.notEqual(
    profileHash(yaml(profile("quad", 1))),
    profileHash(yaml(rebound)),
  );
});

test("each craft keeps its own newest backups", async () => {
  const store = memoryStore();
  let now = 1000;
  const backups = new ProfileBackups(Promise.resolve(store), () => now++);
  const other = { ...board, uid: new Uint8Array(8) };
  for (let i = 0; i < 25; i++) backups.record(board, profile("a", i, i));
  await backups.record(other, profile("b", 0));
  const list = await backups.list(board);
  assert.equal(list.length, 20);
  assert.match(list[0].yaml, /kp: 24/);
  assert.equal((await backups.list(other)).length, 1);
});

test("the profile is captured when recorded", async () => {
  const store = memoryStore();
  const backups = new ProfileBackups(Promise.resolve(store));
  const p = profile("quad", 1);
  const done = backups.record(board, p);
  p.pid.kp = 99;
  await done;
  assert.match(store.entries[0].yaml, /kp: 1\n/);
});

test("without storage nothing is kept", async () => {
  const backups = new ProfileBackups(Promise.reject(new Error("blocked")));
  await backups.record(board, profile("quad", 1));
  assert.deepEqual(await backups.list(board), []);
});
