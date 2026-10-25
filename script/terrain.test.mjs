import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COORD_SCALE,
  MULTI_VERTICAL_RATES,
  MissionEndAction,
  SPEED_SCALE,
  WING_VERTICAL_RATES,
  WaypointType,
  missionLegs,
  missionPath,
  missionRoute,
  pathAltitude,
  pathReach,
} from "../src/store/util/mission.ts";
import {
  Terrain,
  decodeTerrarium,
  lowestClearance,
  sampleRoute,
  terrainProfile,
  worldPixel,
} from "../src/store/util/terrain.ts";

const at = (lat, lon) => ({
  lat: Math.round(lat * COORD_SCALE),
  lon: Math.round(lon * COORD_SCALE),
});
// Speeds in m/s, stored as the firmware's 0.1 m/s.
const wp = (lat, lon, alt = 30, speed = 0) => ({
  ...at(lat, lon),
  alt,
  speed: Math.round(speed / SPEED_SCALE),
  type: WaypointType.Stop,
});

test("terrarium pixels decode to metres", () => {
  // 32768 + 512.5 = 128 * 256 + 2 * 256 + 0 + 128 / 256
  assert.deepEqual(
    [...decodeTerrarium([130, 0, 128, 255, 128, 0, 0, 255])],
    [512.5, 0],
  );
});

test("world pixels follow web mercator", () => {
  const size = 256 * 2 ** 13;
  const origin = worldPixel(at(0, 0));
  assert.equal(origin.x, size / 2);
  assert.ok(Math.abs(origin.y - size / 2) < 1e-6);
  assert.ok(worldPixel(at(48, 11)).y < size / 2);
});

test("elevation interpolates across tile edges", async () => {
  // Every pixel holds its world x, so bilinear sampling returns the sampled x
  // exactly, also on the seam between two tiles.
  const loaded = [];
  const terrain = new Terrain(async (z, x, y) => {
    loaded.push(`${x}/${y}`);
    const tile = new Float32Array(256 * 256);
    for (let i = 0; i < tile.length; i++) tile[i] = x * 256 + (i % 256);
    return tile;
  });
  const p = at(48, 11);
  assert.ok(Number.isNaN(terrain.elevation(p)));
  const { x } = worldPixel(p);
  const seam = { lat: p.lat, lon: p.lon };
  // Move onto the seam: the last pixel centre of the tile, plus a quarter.
  const target = (Math.floor(x / 256) + 1) * 256 - 0.25;
  seam.lon = Math.round(((target / (256 * 2 ** 13)) * 360 - 180) * COORD_SCALE);
  await terrain.load([p, seam]);
  assert.ok(Math.abs(terrain.elevation(p) - (x - 0.5)) < 1e-3);
  const sx = worldPixel(seam).x;
  assert.ok(Math.floor(sx - 0.5) % 256 == 255, "sample straddles the seam");
  assert.ok(Math.abs(terrain.elevation(seam) - (sx - 0.5)) < 1e-2);
  await terrain.load([p, seam]);
  assert.equal(new Set(loaded).size, loaded.length, "tiles load once");
});

test("failed tiles are retried", async () => {
  let fail = true;
  const terrain = new Terrain(async () => {
    if (fail) throw new Error("offline");
    return new Float32Array(256 * 256).fill(7);
  });
  await assert.rejects(terrain.load([at(48, 11)]));
  fail = false;
  await terrain.load([at(48, 11)]);
  assert.equal(terrain.elevation(at(48, 11)), 7);
});

test("route samples include every vertex at their distance", () => {
  const route = [at(48, 11), at(48.001, 11), at(48.001, 11.002)];
  const samples = sampleRoute(route, 25);
  assert.deepEqual(samples[0].point, route[0]);
  assert.deepEqual(samples[samples.length - 1].point, route[2]);
  for (let i = 1; i < samples.length; i++) {
    assert.ok(samples[i].d - samples[i - 1].d <= 25 + 1e-6);
  }
});

const rates = (mission, home, r, rth = 0) =>
  missionPath(mission, home, missionLegs(mission, home, 10), r, rth);

test("multirotors climb in place only to start the mission", () => {
  const home = at(48, 11);
  const mission = {
    end_action: MissionEndAction.Hold,
    waypoints: [
      wp(48.001, 11, 50, 10),
      wp(48.002, 11, 30, 10),
      wp(48.003, 11, 50, 10),
    ],
  };
  const path = rates(mission, home, MULTI_VERTICAL_RATES);
  assert.deepEqual(path.slice(0, 2), [
    { d: 0, alt: 0, index: undefined },
    { d: 0, alt: 50 },
  ]);
  const first = path.find((v) => v.index == 0).d;
  // 20 m at 2 m/s while flying 10 m/s takes 100 m, down and back up.
  assert.ok(Math.abs(path[3].d - first - 100) < 1e-6);
  assert.equal(path[3].alt, 30);
  const second = path.find((v) => v.index == 1);
  assert.equal(second.alt, 30);
  const climb = path[path.indexOf(second) + 1];
  assert.ok(Math.abs(climb.d - second.d - 100) < 1e-6);
  assert.equal(climb.alt, 50);
  assert.equal(pathAltitude(path, 0), 0);
  assert.equal(pathAltitude(path, first / 2), 50);
});

test("multirotors carry on from a waypoint reached short of it", () => {
  const mission = {
    end_action: MissionEndAction.Hold,
    waypoints: [
      wp(48, 11, 30, 10),
      wp(48.001, 11, 130, 10),
      wp(48.002, 11, 130, 10),
    ],
  };
  const path = rates(mission, undefined, MULTI_VERTICAL_RATES);
  const mid = path.find((v) => v.index == 1);
  // 111 m at 10 m/s climbs 22 m at 2 m/s.
  assert.ok(Math.abs(mid.alt - (30 + (2 * mid.d) / 10)) < 1e-6);
  assert.equal(path.filter((v) => v.d == mid.d).length, 1, "no climb in place");
  // The last waypoint is held at its altitude.
  const last = path[path.length - 1];
  assert.equal(last.index, 2);
  assert.equal(last.alt, 130);
  assert.ok(path[path.length - 2].alt < 130);
});

test("wings circle up to within the margin of a waypoint", () => {
  const mission = {
    end_action: MissionEndAction.Hold,
    waypoints: [
      wp(48, 11, 30, 10),
      wp(48.001, 11, 130, 10),
      wp(48.002, 11, 130, 10),
    ],
  };
  const path = rates(mission, undefined, WING_VERTICAL_RATES);
  const mid = path.find((v) => v.index == 1);
  // 111 m at 10 m/s climbs 33 m at 3 m/s, then circles up to 120.
  assert.ok(Math.abs(path[1].alt - (30 + (3 * mid.d) / 10)) < 1e-6);
  assert.equal(path[1].d, mid.d);
  assert.equal(mid.alt, 120);
  assert.equal(path[path.length - 1].alt, 130);
});

test("rth climbs by the rth altitude in place and flies home", () => {
  const home = at(48, 11);
  const mission = {
    end_action: MissionEndAction.RTH,
    waypoints: [wp(48.001, 11, 30, 10)],
  };
  assert.equal(missionRoute(mission, home).length, 3);
  const path = rates(mission, home, MULTI_VERTICAL_RATES, 20);
  const at1 = path.find((v) => v.index == 0).d;
  assert.deepEqual(path.slice(-2), [
    { d: at1, alt: 50 },
    { d: path[path.length - 1].d, alt: 50 },
  ]);
});

test("path reach interpolates along a slope", () => {
  const path = [
    { d: 0, alt: 0 },
    { d: 100, alt: 40 },
  ];
  assert.equal(pathReach(path, 10), 25);
  assert.equal(pathReach(path, 50), Infinity);
  assert.equal(
    pathReach(
      [
        { d: 0, alt: 0 },
        { d: 0, alt: 40 },
      ],
      10,
    ),
    0,
  );
});

test("clearance skips the takeoff and finds the lowest point", () => {
  const path = [
    { d: 0, alt: 0 },
    { d: 0, alt: 40 },
    { d: 300, alt: 40, index: 0 },
  ];
  const ground = [0, 100, 200, 300].map((d) => ({
    d,
    elevation: 500 + (d == 200 ? 30 : 0),
  }));
  const profile = terrainProfile(ground, 500, path);
  assert.deepEqual(profile[2], { d: 200, ground: 30, flight: 40 });
  assert.deepEqual(lowestClearance(profile, 0, 300, 0), {
    d: 200,
    clearance: 10,
  });
  assert.equal(lowestClearance(profile, 0, 100, 100), undefined);
});
