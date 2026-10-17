import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COORD_SCALE,
  MissionEndAction,
  distance,
  missionFromFile,
  missionLegs,
  missionToFile,
  validateMission,
} from "../src/store/util/mission.ts";

const at = (lat, lon) => ({
  lat: Math.round(lat * COORD_SCALE),
  lon: Math.round(lon * COORD_SCALE),
});
const wp = (lat, lon, alt = 30, speed = 0) => ({ ...at(lat, lon), alt, speed });

test("distance matches a known great-circle length", () => {
  // One thousandth of a degree of latitude is about 111 m.
  assert.ok(Math.abs(distance(at(48, 11), at(48.001, 11)) - 111.2) < 0.5);
  assert.equal(distance(at(48, 11), at(48, 11)), 0);
});

test("legs start at home and return for RTH only", () => {
  const home = at(48, 11);
  const waypoints = [wp(48.001, 11, 30, 10), wp(48.002, 11, 30, 0)];
  const hold = missionLegs(
    { end_action: MissionEndAction.Hold, waypoints },
    home,
    5,
  );
  assert.equal(hold.length, 2);
  assert.equal(hold[0].speed, 10);
  assert.equal(hold[1].speed, 5, "speed 0 falls back to cruise speed");
  const rth = missionLegs(
    { end_action: MissionEndAction.RTH, waypoints },
    home,
    5,
  );
  assert.equal(rth.length, 3);
  assert.equal(
    missionLegs({ end_action: 1, waypoints }, undefined, 5).length,
    1,
  );
  // Wings fly every leg at cruise speed.
  const wing = missionLegs(
    { end_action: MissionEndAction.Hold, waypoints },
    home,
    15,
    false,
  );
  assert.deepEqual(
    wing.map((leg) => leg.speed),
    [15, 15],
  );
});

test("validation blocks bad missions and only warns on distance", () => {
  const errors = (mission, opts = {}) =>
    validateMission(mission, { maxWaypoints: 2, routeDistance: 0, ...opts })
      .filter((i) => i.level == "error")
      .map((i) => i.index);

  assert.equal(errors({ end_action: 0, waypoints: [] }).length, 1);
  assert.equal(
    errors({ end_action: 0, waypoints: [wp(1, 1), wp(2, 2), wp(3, 3)] }).length,
    1,
  );
  assert.deepEqual(errors({ end_action: 0, waypoints: [wp(0, 0)] }), [0]);
  assert.deepEqual(errors({ end_action: 0, waypoints: [wp(1, 1, 0)] }), [0]);
  assert.deepEqual(
    errors({ end_action: 0, waypoints: [wp(1, 1, 30, -1)] }),
    [0],
  );
  assert.deepEqual(errors({ end_action: 0, waypoints: [wp(91, 1)] }), [0]);

  // Default multirotor limits: 5-5000 m above launch, at most 30 m/s.
  assert.deepEqual(errors({ end_action: 0, waypoints: [wp(1, 1, 4.9)] }), [0]);
  assert.deepEqual(errors({ end_action: 0, waypoints: [wp(1, 1, 5)] }), []);
  assert.deepEqual(errors({ end_action: 0, waypoints: [wp(1, 1, 5000)] }), []);
  // Limits reported by the firmware replace the defaults, as for a wing.
  const wing = { limits: { min_alt: 20, max_alt: 5000, max_speed: 30 } };
  assert.deepEqual(
    errors({ end_action: 0, waypoints: [wp(1, 1, 19)] }, wing),
    [0],
  );
  assert.deepEqual(
    errors({ end_action: 0, waypoints: [wp(1, 1, 20)] }, wing),
    [],
  );
  assert.deepEqual(errors({ end_action: 0, waypoints: [wp(1, 1, 5001)] }), [0]);
  assert.deepEqual(
    errors({ end_action: 0, waypoints: [wp(1, 1, 30, 108 / 3.6)] }),
    [],
  );
  assert.deepEqual(
    errors({ end_action: 0, waypoints: [wp(1, 1, 30, 31)] }),
    [0],
  );

  const issues = validateMission(
    { end_action: 0, waypoints: [wp(48.1, 11)] },
    { maxWaypoints: 32, reference: at(48, 11), routeDistance: 6000 },
  );
  assert.deepEqual(
    issues.map((i) => i.level),
    ["warning", "warning"],
  );
});

test("mission files round-trip coordinates exactly", () => {
  const mission = {
    end_action: MissionEndAction.RTH,
    waypoints: [
      { lat: 481234567, lon: -113456789, alt: 42.5, speed: 7 },
      { lat: -339999999, lon: 1799999999, alt: 10, speed: 0 },
    ],
  };
  assert.deepEqual(missionFromFile(missionToFile(mission)), mission);
  assert.throws(() => missionFromFile("{}"), /not a mission file/);
});
