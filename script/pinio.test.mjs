import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import semver from "semver";
import ts from "typescript";

function migration() {
  const defaults = {
    receiver: {
      aux: Array.from({ length: 20 }, () => ({
        channel: 16,
        range_min: 0,
        range_max: 0,
      })),
    },
  };
  const imports = {
    "./default_profile": { useDefaultProfileStore: () => defaults },
    pinia: { defineStore: () => ({}) },
    "./serial/serial": {},
    "./serial/quic": {},
    "@/log": {},
    semver,
    "./util": {},
    "./root": {},
    "@/mixin/filters": {},
    "./types": { output_source_t: {} },
    "./target": {},
    "./util/osd": {},
  };
  const source = readFileSync(
    new URL("../src/store/profile.ts", import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(
    source + "\nexport { migrateProfileVersion };",
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  );
  const exports = {};
  runInNewContext(outputText, {
    exports,
    require: (name) => {
      assert.ok(name in imports, `Unexpected import: ${name}`);
      return imports[name];
    },
  });
  return (channel, target = { pinio: [{ pin: "PC6" }] }) => {
    const aux = Array(15).fill(12); // Released v0.2.7 has no RTH/PINIO slots.
    aux[11] = channel;
    return exports.migrateProfileVersion(
      { meta: {}, receiver: { aux } },
      target,
      "v0.2.7",
      "v0.3.1",
    );
  };
}

test("released FPV channel assignments preserve inverse serial pit mode", () => {
  const result = migration()(2);
  assert.equal(result.receiver.aux.length, 20);
  assert.equal(result.receiver.aux[15].channel, 16);
  assert.equal(result.receiver.aux[16].channel, 16);
  assert.equal(result.receiver.aux[11].channel, 6);
  assert.equal(result.receiver.aux[11].range_min, 0);
  assert.equal(result.receiver.aux[11].range_max, 32767);
});

test("released always on/off power assignments leave serial pit mode unassigned", () => {
  const migrate = migration();
  for (const channel of [12, 13]) {
    const result = migrate(channel);
    assert.equal(result.receiver.aux[16].channel, 16);
    assert.equal(result.receiver.aux[11].channel, 16);
  }
});

test("new GPIO outputs keep their default assignments on profile import", () => {
  const migrate = migration();
  for (const target of [
    {},
    { pinio: [{ pin: "NONE" }] },
    { pinio: [{ pin: "PB5", label: "Camera select" }] },
  ]) {
    assert.equal(migrate(2, target).receiver.aux[16].channel, 16);
  }
});
