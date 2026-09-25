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

// Preview positions must stay within the character grid, including full text width.
import { osdPosition } from "../src/ui/osd.ts";
test("OSD movement snaps to cells and contains the entire element", () => {
  assert.deepEqual(osdPosition(5.4, 2.8, 5), { x: 5, y: 3 });
  assert.deepEqual(osdPosition(29, 18, 5), { x: 25, y: 15 });
  assert.deepEqual(osdPosition(-5, -2, 5), { x: 0, y: 0 });
  assert.deepEqual(osdPosition(20, 4, 40), { x: 0, y: 4 });
  assert.deepEqual(osdPosition(NaN, Infinity, 0), { x: 0, y: 0 });
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
