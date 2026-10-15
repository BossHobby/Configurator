import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readAppearance,
  resolveAppearance,
  channelPosition,
} from "../src/ui/model.ts";

test("explicit appearance wins, including System over a legacy override", () => {
  assert.equal(readAppearance("system", "true"), "system");
  assert.equal(readAppearance("light", "true"), "light");
  assert.equal(readAppearance("dark", "false"), "dark");
});
test("missing or invalid preferences migrate legacy light and dark values", () => {
  assert.equal(readAppearance(null, "false"), "light");
  assert.equal(readAppearance("invalid", "true"), "dark");
  assert.equal(readAppearance(null, null), "system");
});
test("system follows OS changes while manual selection is stable", () => {
  assert.equal(resolveAppearance("system", true), "dark");
  assert.equal(resolveAppearance("system", false), "light");
  assert.equal(resolveAppearance("light", true), "light");
  assert.equal(resolveAppearance("dark", false), "dark");
});
test("channel positions respect endpoints and clamp invalid telemetry", () => {
  assert.equal(channelPosition(-1, -1, 1), 0);
  assert.equal(channelPosition(0, -1, 1), 50);
  assert.equal(channelPosition(1, -1, 1), 100);
  assert.equal(channelPosition(20, -1, 1), 100);
  assert.equal(channelPosition(-20, -1, 1), 0);
  assert.equal(channelPosition(NaN, -1, 1), 0);
  assert.equal(channelPosition(1, 1, 1), 0);
  assert.equal(channelPosition(1500, 1000, 2000), 50);
});

import { receiverChannelPercent, auxRangeActive } from "../src/ui/receiver.ts";
test("AUX telemetry uses the firmware uint16 range, including raw value one", () => {
  assert.equal(receiverChannelPercent(1), 0);
  assert.equal(receiverChannelPercent(32768), 50);
  assert.equal(receiverChannelPercent(65535), 100);
});
test("AUX activation follows firmware boundaries and treats zero/zero as disabled", () => {
  assert.equal(auxRangeActive(0, 0, 0), false);
  assert.equal(auxRangeActive(undefined, 0, 65535), false);
  assert.equal(auxRangeActive(32767, 32768, 65535), false);
  assert.equal(auxRangeActive(32768, 32768, 65535), true);
  assert.equal(auxRangeActive(65535, 32768, 65535), true);
});

import { migrateReceiverV031 } from "../src/store/util/receiver.ts";
test("0.3.1 receiver migration selects the unified serial protocol directly", () => {
  const raw = new Uint8Array(64);
  raw[0] = 8; // FPORT_INVERTED
  const fport = migrateReceiverV031({
    protocol: 1,
    lqi_source: 2,
    bind: { bind_saved: 1, raw },
  });
  assert.equal(fport.protocol, 5);
  assert.equal(fport.invert, 1);
  assert.equal(fport.lqi_source, 2);
  assert.deepEqual([...fport.bind.raw], new Array(64).fill(0));
  assert.equal(fport.bind.bind_saved, undefined);

  raw[0] = 10; // MAVLINK, never saved: autodetect
  assert.equal(
    migrateReceiverV031({ protocol: 1, bind: { bind_saved: 0, raw } }).protocol,
    1,
  );
  raw[0] = 10;
  assert.equal(
    migrateReceiverV031({ protocol: 1, bind: { bind_saved: 1, raw } }).protocol,
    8,
  );
});
test("0.3.1 receiver migration renumbers SPI protocols and retires Bayang", () => {
  const raw = new Uint8Array(64).fill(7);
  const elrs = migrateReceiverV031({
    protocol: 14,
    bind: { bind_saved: 1, raw },
  });
  assert.equal(elrs.protocol, 13);
  assert.equal(elrs.bind.raw[5], 7);
  assert.equal(
    migrateReceiverV031({ protocol: 14, bind: { bind_saved: 0, raw } }).bind
      .raw[5],
    0,
  );
  assert.equal(migrateReceiverV031({ protocol: 8, bind: { raw } }).protocol, 0);
  assert.equal(
    migrateReceiverV031({ protocol: 16, bind: { raw } }).protocol,
    15,
  );
  assert.equal(migrateReceiverV031({ protocol: 3, bind: { raw } }).protocol, 3);
});
