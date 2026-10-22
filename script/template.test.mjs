import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import semver from "semver";
import ts from "typescript";
import * as receiver from "../src/store/util/receiver.ts";

const V022 = 0x000202; // Pilot Rates template
const V031 = 0x000301; // firmware

// Objects built inside the module's context have its prototypes.
const plain = (value) => JSON.parse(JSON.stringify(value));

function profileModule() {
  const defaults = {
    meta: { version: V031 },
    filter: { dterm_dynamic_type: 0, gyro_dynamic_notch_enable: 1 },
    motor: { gyro_orientation: 48, digital_idle: 4.5 },
    wing: { turn_coordination: 1, autolaunch: { throttle: 0.7 } },
    navigation: { cruise_speed: 15, loiter_radius: 100 },
    receiver: {
      aux: Array.from({ length: 21 }, () => ({
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
    "./util": {
      decodeSemver: (v) =>
        `v${(v >> 16) & 0xff}.${(v >> 8) & 0xff}.${v & 0xff}`,
    },
    "./root": {},
    "@/mixin/filters": {},
    "./types": {
      output_source_t: {
        OUTPUT_SOURCE_ROLL: 2,
        OUTPUT_SOURCE_PITCH: 3,
        OUTPUT_SOURCE_YAW: 4,
      },
    },
    "./target": { useTargetStore: () => ({ $state: { serial_ports: [] } }) },
    "./util/osd": {},
    "./util/receiver": receiver,
  };
  const source = readFileSync(
    new URL("../src/store/profile.ts", import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const exports = {};
  runInNewContext(outputText, {
    exports,
    require: (name) => {
      assert.ok(name in imports, `Unexpected import: ${name}`);
      return imports[name];
    },
    atob,
    Uint8Array,
    Date,
    JSON,
  });
  return exports;
}

// A wing profile with its own mixer, switches and settings.
function wingProfile() {
  return {
    meta: { version: V031, name: "Trainer" },
    mixer: [
      { output_index: 0, source: 1, source_index: 0, weight: 100 },
      { output_index: 1, source: 3, source_index: 0, weight: 100 },
      { output_index: 2, source: 2, source_index: 0, weight: 100 },
    ],
    motor: { gyro_orientation: 32 },
    filter: { dterm_dynamic_type: 1 },
    wing: { turn_coordination: 1, autolaunch: { throttle: 0.8 } },
    navigation: { cruise_speed: 17.4, loiter_radius: 70 },
    receiver: {
      aux: Array.from({ length: 21 }, (_, i) => ({
        channel: i === 11 ? 6 : 16,
        range_min: i === 11 ? 22937 : 0,
        range_max: i === 11 ? 65535 : 0,
      })),
    },
    rate: {
      profile: 0,
      rates: [
        {
          mode: 0,
          rate: [
            [860, 860, 500],
            [0.8, 0.8, 0.6],
            [0.55, 0, 0.55],
          ],
        },
        {
          mode: 1,
          rate: [
            [1.3, 1.3, 1.3],
            [0.7, 0.7, 0.7],
            [0.4, 0.4, 0.4],
          ],
        },
      ],
    },
  };
}

const pilotRates = {
  meta: { version: V022 },
  rate: {
    profile: 0,
    rates: [
      {
        mode: 2,
        rate: [
          [30, 30, 30],
          [800, 800, 700],
          [0.45, 0.45, 0],
        ],
      },
    ],
  },
};

test("an old rates template contributes only its rates", () => {
  const { migrateTemplatePatch } = profileModule();
  const patch = plain(migrateTemplatePatch(pilotRates));
  assert.deepEqual(Object.keys(patch).sort(), ["meta", "rate"]);
  assert.deepEqual(patch.meta, {});
  assert.deepEqual(patch.rate, pilotRates.rate);
});

test("applying it keeps the mixer, switches, settings and version", () => {
  const { migrateTemplatePatch, mergeDeep } = profileModule();
  const profile = wingProfile();
  const before = JSON.parse(JSON.stringify(profile));
  const merged = mergeDeep(profile, migrateTemplatePatch(pilotRates));

  assert.deepEqual(merged.mixer, before.mixer);
  assert.deepEqual(merged.receiver, before.receiver);
  assert.deepEqual(merged.motor, before.motor);
  assert.deepEqual(merged.filter, before.filter);
  assert.deepEqual(merged.wing, before.wing);
  assert.deepEqual(merged.navigation, before.navigation);
  assert.equal(merged.meta.version, V031);
  assert.deepEqual(merged.rate.rates[0], pilotRates.rate.rates[0]);
  assert.deepEqual(merged.rate.rates[1], before.rate.rates[1]);
});

test("an old template's converted fields still apply", () => {
  const { migrateTemplatePatch } = profileModule();
  const patch = plain(
    migrateTemplatePatch({
      meta: { version: V022 },
      filter: { dterm_dynamic_enable: 1 },
    }),
  );
  assert.deepEqual(patch.filter, {
    dterm_dynamic_enable: 1,
    dterm_dynamic_type: 1,
  });
  assert.equal(patch.mixer, undefined);
  assert.equal(patch.motor, undefined);
});

test("a template saved from a board leaves the board's build", () => {
  const { migrateTemplatePatch } = profileModule();
  const patch = plain(
    migrateTemplatePatch({
      meta: {
        version: V031,
        name: "Wingman",
        datetime: 1792670400,
        firmware: "v0.11.3-42-gabcdef1",
      },
    }),
  );
  assert.deepEqual(patch.meta, { name: "Wingman" });
});

test("a template without a version applies as written", () => {
  const { migrateTemplatePatch } = profileModule();
  const template = {
    meta: { name: "Wingman" },
    motor: { digital_idle: 6 },
  };
  assert.deepEqual(plain(migrateTemplatePatch(template)), template);
});
