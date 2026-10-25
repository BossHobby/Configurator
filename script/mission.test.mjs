import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COORD_SCALE,
  MISSION_DEFAULT_LIMITS,
  MULTI_VERTICAL_RATES,
  MissionEndAction,
  WaypointType,
  distance,
  headingRun,
  missionFromFile,
  missionLegs,
  missionPath,
  missionRoute,
  missionToFile,
  validateMission,
} from "../src/store/util/mission.ts";

const at = (lat, lon) => ({
  lat: Math.round(lat * COORD_SCALE),
  lon: Math.round(lon * COORD_SCALE),
});
const wp = (lat, lon, alt = 30, speed = 0, type = WaypointType.Stop) => ({
  ...at(lat, lon),
  alt,
  speed,
  type,
});

test("distance matches a known great-circle length", () => {
  // One thousandth of a degree of latitude is about 111 m.
  assert.ok(Math.abs(distance(at(48, 11), at(48.001, 11)) - 111.2) < 0.5);
  assert.equal(distance(at(48, 11), at(48, 11)), 0);
});

test("legs start at home and return for RTH only", () => {
  const home = at(48, 11);
  // Waypoint speeds are in 0.1 m/s, leg speeds in m/s.
  const waypoints = [wp(48.001, 11, 30, 100), wp(48.002, 11, 30, 0)];
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

  // Default multirotor limits: 5-5000 m above launch, at most 25.5 m/s.
  assert.deepEqual(errors({ end_action: 0, waypoints: [wp(1, 1, 4)] }), [0]);
  assert.deepEqual(errors({ end_action: 0, waypoints: [wp(1, 1, 5)] }), []);
  assert.deepEqual(errors({ end_action: 0, waypoints: [wp(1, 1, 5000)] }), []);
  // Limits reported by the firmware replace the defaults, as for a wing.
  const wing = {
    limits: { ...MISSION_DEFAULT_LIMITS, min_alt: 20, waypoint_types: 1 },
  };
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
    errors({ end_action: 0, waypoints: [wp(1, 1, 30, 255)] }),
    [],
  );
  assert.deepEqual(
    errors({ end_action: 0, waypoints: [wp(1, 1, 30, 256)] }),
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
      { lat: 481234567, lon: -113456789, alt: 42, speed: 73, type: 1 },
      { lat: -339999999, lon: 1799999999, alt: -10, speed: 0, type: 0 },
    ],
  };
  assert.deepEqual(missionFromFile(missionToFile(mission)), mission);
  // Files keep m/s, readable by hand.
  assert.equal(JSON.parse(missionToFile(mission)).waypoints[0].speed, 7.3);
  assert.throws(() => missionFromFile("{}"), /not a mission file/);
});

test("takeoff only starts and landing only ends a mission", () => {
  const errors = (waypoints, limits = MISSION_DEFAULT_LIMITS) =>
    validateMission(
      { end_action: 0, waypoints },
      { maxWaypoints: 32, routeDistance: 0, limits },
    )
      .filter((i) => i.level == "error")
      .map((i) => i.index);
  const T = WaypointType;
  const route = [
    wp(48, 11, 10, 0, T.Takeoff),
    wp(48.001, 11, 30, 0, T.Pass),
    wp(48.002, 11, -20, 0, T.Land),
  ];
  assert.deepEqual(errors(route), [], "a landing ground may be below launch");
  assert.deepEqual(
    errors([route[0], { ...route[1], type: T.Takeoff }, route[2]]),
    [1],
  );
  assert.deepEqual(
    errors([route[0], { ...route[1], type: T.Land }, route[2]]),
    [1],
  );
  assert.deepEqual(
    errors([route[0], route[1], { ...route[2], type: T.Stop }]),
    [2],
  );
  // Firmware reports how many types it flies; a wing only stops.
  assert.deepEqual(
    errors(route, { ...MISSION_DEFAULT_LIMITS, waypoint_types: 2 }),
    [0, 2],
  );
  assert.deepEqual(
    errors([wp(48, 11, 30, 0, T.Pass)], {
      ...MISSION_DEFAULT_LIMITS,
      waypoint_types: 1,
    }),
    [0],
  );
});

test("the heading run after a takeoff points from #1 past #2", () => {
  const T = WaypointType;
  // #2 about 56 m away, closer than the 75 m heading run.
  const close = [wp(48, 11, 10, 0, T.Takeoff), wp(48.0005, 11)];
  const run = headingRun(close);
  assert.ok(run);
  assert.ok(Math.abs(distance(run[0], run[1]) - 75) < 0.5);
  assert.ok(run[1].lat > close[1].lat, "points past #2 along the line");
  assert.equal(headingRun([wp(48, 11), wp(48.001, 11)]), undefined);
});

test("a landing mission descends to its ground and does not return", () => {
  const home = at(48, 11);
  const T = WaypointType;
  const mission = {
    end_action: MissionEndAction.RTH,
    waypoints: [
      wp(48, 11.0001, 10, 0, T.Takeoff),
      wp(48.001, 11, 20),
      wp(48.002, 11, -3, 0, T.Land),
    ],
  };
  const legs = missionLegs(mission, home, 5);
  assert.equal(legs.length, 3, "no return leg after a landing");
  assert.equal(missionRoute(mission, home).length, 4);
  const path = missionPath(mission, home, legs, MULTI_VERTICAL_RATES, 10);
  const last = path[path.length - 1];
  assert.equal(last.alt, -3);
  assert.equal(last.index, 2);
  // The landing leg flies level at #2's altitude before the descent.
  assert.equal(path[path.length - 2].alt, 20);
  assert.equal(path[path.length - 2].d, last.d);
});
