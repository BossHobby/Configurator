import { test } from "node:test";
import assert from "node:assert/strict";
import {
  arcSpeed,
  bendArc,
  legDistance,
  legMiddle,
  legPoints,
  legRadius,
  splitLeg,
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
  missionTime,
  missionToFile,
  newWaypoint,
  setWaypointType,
  validateMission,
} from "../src/store/util/mission.ts";

const at = (lat, lon) => ({
  lat: Math.round(lat * COORD_SCALE),
  lon: Math.round(lon * COORD_SCALE),
});
const wp = (
  lat,
  lon,
  alt = 30,
  speed = 0,
  type = WaypointType.Stop,
  hold = 0,
  arc = 0,
) => ({
  ...at(lat, lon),
  alt,
  speed,
  type,
  hold,
  arc,
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
  assert.equal(rth[2].speed, 5, "the return flies at cruise speed");
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
      {
        lat: 481234567,
        lon: -113456789,
        alt: 42,
        speed: 73,
        type: 1,
        hold: 0,
        arc: 0,
      },
      {
        lat: -339999999,
        lon: 1799999999,
        alt: -10,
        speed: 0,
        type: 0,
        hold: 9,
        arc: -120,
      },
    ],
  };
  assert.deepEqual(missionFromFile(missionToFile(mission)), mission);
  // Files keep m/s, readable by hand.
  assert.equal(JSON.parse(missionToFile(mission)).waypoints[0].speed, 7.3);
  assert.throws(() => missionFromFile("{}"), /not a mission file/);
  const bare = JSON.parse(missionToFile(mission));
  delete bare.waypoints[1].hold;
  assert.equal(missionFromFile(JSON.stringify(bare)).waypoints[1].hold, 0);
  // A straight leg is written without an arc and read back as one.
  delete bare.waypoints[1].arc;
  assert.equal(missionFromFile(JSON.stringify(bare)).waypoints[1].arc, 0);
  const straight = JSON.parse(
    missionToFile(missionFromFile(JSON.stringify(bare))),
  );
  assert.ok(!("arc" in straight.waypoints[1]));
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

test("only stop waypoints hold, for up to 255 s", () => {
  const T = WaypointType;
  const errors = (waypoints) =>
    validateMission(
      { end_action: 0, waypoints },
      { maxWaypoints: 32, routeDistance: 0 },
    )
      .filter((i) => i.level == "error")
      .map((i) => i.index);
  assert.deepEqual(errors([wp(48, 11, 30, 0, T.Stop, 255)]), []);
  assert.deepEqual(errors([wp(48, 11, 30, 0, T.Stop, 256)]), [0]);
  assert.deepEqual(errors([wp(48, 11, 30, 0, T.Stop, -1)]), [0]);
  assert.deepEqual(errors([wp(48, 11, 30, 0, T.Stop, 1.5)]), [0]);
  assert.deepEqual(errors([{ ...wp(48, 11), hold: undefined }]), [0]);
  assert.deepEqual(
    errors([
      wp(48, 11, 10, 0, T.Takeoff, 5),
      wp(48.001, 11, 30, 0, T.Pass, 5),
      wp(48.002, 11, 0, 0, T.Land, 5),
    ]),
    [0, 1, 2],
  );
});

test("new waypoints fly through where the vehicle can", () => {
  const point = at(48, 11);
  const multi = newWaypoint(point, MISSION_DEFAULT_LIMITS);
  assert.equal(multi.type, WaypointType.Pass);
  assert.equal(multi.hold, 0);
  assert.equal(multi.alt, 30);
  const wing = newWaypoint(point, {
    ...MISSION_DEFAULT_LIMITS,
    waypoint_types: 1,
  });
  assert.equal(wing.type, WaypointType.Stop);
  // The altitude and speed follow the previous waypoint, not its hold.
  const next = newWaypoint(
    point,
    MISSION_DEFAULT_LIMITS,
    wp(48, 11, 80, 50, WaypointType.Stop, 20),
  );
  assert.deepEqual(
    [next.alt, next.speed, next.type, next.hold],
    [80, 50, WaypointType.Pass, 0],
  );
  const afterLanding = newWaypoint(
    point,
    MISSION_DEFAULT_LIMITS,
    wp(48, 11, -5, 0, WaypointType.Land),
  );
  assert.equal(afterLanding.alt, 30);
});

test("a waypoint turned into a landing gets launch-level ground", () => {
  const wps = [wp(48, 11, 50), wp(48.001, 11, 50, 0, WaypointType.Stop, 20)];
  setWaypointType(wps, 1, WaypointType.Land);
  assert.deepEqual([wps[1].alt, wps[1].hold], [0, 0]);
  // An entered ground height survives choosing Land again.
  wps[1].alt = 12;
  setWaypointType(wps, 1, WaypointType.Land);
  assert.equal(wps[1].alt, 12);
  // Back in flight, it follows the previous waypoint's altitude.
  setWaypointType(wps, 1, WaypointType.Pass);
  assert.equal(wps[1].alt, 50);
  setWaypointType(wps, 0, WaypointType.Land);
  setWaypointType(wps, 0, WaypointType.Stop);
  assert.equal(wps[0].alt, 30);
});

test("the time estimate includes every hold", () => {
  const home = at(48, 11);
  const mission = {
    end_action: MissionEndAction.RTH,
    waypoints: [wp(48.001, 11, 30, 0, 0, 10), wp(48.002, 11, 30, 0, 0, 25)],
  };
  const legs = missionLegs(mission, home, 5);
  const flying = legs.reduce((sum, leg) => sum + leg.time, 0);
  assert.ok(Math.abs(missionTime(mission, legs) - flying - 35) < 1e-9);
});

// 111.19 m per 0.001 degree of latitude; on the equator the same east.
const METER = 0.001 / 111.19493;

test("an arc is a circle through both waypoints, clockwise when positive", () => {
  const from = at(0, 1);
  const to = at(0, 1 + 200 * METER);
  // A half circle on a 200 m chord to the east: 100 m radius, round the north.
  assert.ok(Math.abs(legRadius(from, to, 180) - 100) < 0.1);
  assert.ok(Math.abs(legDistance(from, to, 180) - 100 * Math.PI) < 0.3);
  const north = legMiddle(from, to, 180);
  assert.ok(
    Math.abs(distance(from, { lat: north.lat, lon: from.lon }) - 100) < 0.1,
  );
  assert.ok(north.lat > 0, "a clockwise arc eastward bulges north");
  assert.ok(legMiddle(from, to, -180).lat < 0, "counter-clockwise, south");

  // A quarter circle has its chord times 1/sqrt(2) as radius.
  assert.ok(Math.abs(legRadius(from, to, 90) - 200 / Math.SQRT2) < 0.1);
  // More than a half circle is longer than the circle is wide.
  assert.ok(legDistance(from, to, 300) > 2 * legRadius(from, to, 300));

  // Straight legs, and repeated waypoints an arc cannot be placed on.
  assert.equal(legRadius(from, to, 0), undefined);
  assert.equal(legRadius(from, from, 90), undefined);
  assert.equal(legDistance(from, to), distance(from, to));

  // Every point drawn lies on the circle, and the polyline keeps its ends.
  const points = legPoints(from, to, 180);
  assert.deepEqual(points[0], from);
  assert.deepEqual(points[points.length - 1], to);
  assert.ok(points.length >= 36);
  const center = at(0, 1 + 100 * METER);
  for (const p of points) assert.ok(Math.abs(distance(center, p) - 100) < 0.2);
  assert.deepEqual(legPoints(from, to, 0), [from, to]);
});

test("legs, time and the route follow arcs", () => {
  const mission = {
    end_action: MissionEndAction.Hold,
    waypoints: [wp(0, 1), wp(0, 1 + 200 * METER, 30, 0, 0, 0, 180)],
  };
  // A wing flies the arc at cruise speed.
  const [wing] = missionLegs(mission, undefined, 15, false);
  assert.ok(Math.abs(wing.distance - 100 * Math.PI) < 0.3);
  assert.equal(wing.speed, 15);
  // A multirotor slows down for it: 100 m of radius allow sqrt(1.5 * 100).
  const [multi] = missionLegs(mission, undefined, 15);
  assert.ok(Math.abs(multi.speed - Math.sqrt(150)) < 0.01);
  assert.ok(Math.abs(arcSpeed(4) - (4 * 22.5 * Math.PI) / 180) < 1e-9);
  assert.equal(arcSpeed(0.5), 1);
  assert.equal(missionLegs(mission, undefined, 5)[0].speed, 5);

  const route = missionRoute(mission, undefined);
  assert.ok(route.length >= 36);
  assert.deepEqual(route[0], mission.waypoints[0]);
  // The leg from a takeoff is flown straight.
  mission.waypoints[0].type = WaypointType.Takeoff;
  assert.equal(missionRoute(mission, undefined).length, 2);
  assert.ok(
    Math.abs(missionLegs(mission, undefined, 5)[0].distance - 200) < 0.3,
  );
});

test("a leg bends by dragging its middle and splits on its arc", () => {
  const from = at(0, 1);
  const to = at(0, 1 + 200 * METER);
  // Dragging the middle of a bent leg where it is changes nothing.
  for (const arc of [90, -90, 180, 250, -300])
    assert.equal(bendArc(from, to, legMiddle(from, to, arc), 330), arc);
  assert.equal(bendArc(from, to, at(100 * METER, 1 + 100 * METER), 330), 180);
  // Nearly straight snaps straight; the limit holds.
  assert.equal(bendArc(from, to, at(1 * METER, 1 + 100 * METER), 330), 0);
  assert.equal(bendArc(from, to, at(5000 * METER, 1 + 100 * METER), 330), 330);
  assert.equal(bendArc(from, from, at(1, 1), 330), 0);

  // A waypoint inserted at the top of the half circle halves it.
  const top = splitLeg(from, to, 180, at(120 * METER, 1 + 100 * METER));
  assert.deepEqual(top.arcs, [90, 90]);
  assert.ok(distance(top.point, at(100 * METER, 1 + 100 * METER)) < 0.2);
  // Both halves follow the old circle.
  assert.ok(Math.abs(legRadius(from, top.point, 90) - 100) < 0.2);
  assert.ok(Math.abs(legRadius(top.point, to, 90) - 100) < 0.2);
  // The parts keep the direction and add up.
  const left = splitLeg(from, to, -270, legMiddle(from, to, -90));
  assert.equal(left.arcs[0] + left.arcs[1], -270);
  assert.ok(left.arcs[0] < 0 && left.arcs[1] < 0);
  // A straight leg takes the point as it is.
  const point = at(1 * METER, 1 + 50 * METER);
  assert.deepEqual(splitLeg(from, to, 0, point), { point, arcs: [0, 0] });
});

test("arcs are validated against the vehicle's limit", () => {
  const check = (waypoints, extra = {}) =>
    validateMission(
      { end_action: MissionEndAction.Hold, waypoints },
      {
        maxWaypoints: 32,
        limits: MISSION_DEFAULT_LIMITS,
        routeDistance: 0,
        ...extra,
      },
    );
  const from = wp(0, 1);
  const to = (arc) => wp(0, 1 + 200 * METER, 30, 0, 0, 0, arc);
  assert.deepEqual(check([from, to(180)]), []);
  assert.deepEqual(check([from, to(-330)]), []);
  assert.equal(check([from, to(331)])[0].level, "error");
  assert.equal(check([from, to(90.5)])[0].level, "error");
  assert.equal(check([{ ...from, arc: 90 }, to(0)])[0].level, "error");
  // A vehicle that reports no arc flies none.
  assert.match(
    check([from, to(90)], {
      limits: { ...MISSION_DEFAULT_LIMITS, max_arc: 0 },
    })[0].msg,
    /cannot fly arcs/,
  );
  // A wing flies wide of an arc tighter than it turns.
  const wide = check([from, to(180)], { minArcRadius: 120 });
  assert.equal(wide.length, 1);
  assert.equal(wide[0].level, "warning");
  assert.deepEqual(check([from, to(180)], { minArcRadius: 80 }), []);
  const takeoff = check([{ ...from, type: WaypointType.Takeoff }, to(90)]);
  assert.equal(takeoff[0].level, "warning");
});
