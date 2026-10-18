// Coordinates are kept in the firmware's gps_coord_t units (degrees * 1e7) so
// a mission read from the FC is uploaded back bit for bit.
export const COORD_SCALE = 1e7;

// A const object instead of an enum keeps this module runnable under plain
// node for script/mission.test.mjs.
export const MissionEndAction = { Hold: 0, RTH: 1 } as const;
export type MissionEndAction =
  (typeof MissionEndAction)[keyof typeof MissionEndAction];

export interface Waypoint {
  lat: number;
  lon: number;
  alt: number; // meters above launch, not MSL
  speed: number; // m/s, 0 = navigation.rth_cruise_speed
}

export interface Mission {
  end_action: MissionEndAction;
  waypoints: Waypoint[];
}

export interface GeoPoint {
  lat: number;
  lon: number;
}

// The firmware rejects uploads outside its limits and reports them with every
// mission reply; these multirotor values apply until the first reply.
export interface MissionLimits {
  min_alt: number; // meters above launch
  max_alt: number;
  max_speed: number; // m/s, shown as km/h
}
export const MISSION_DEFAULT_LIMITS: MissionLimits = {
  min_alt: 5,
  max_alt: 5000,
  max_speed: 30,
};
// The firmware will not start a mission whose first point is farther away.
export const MISSION_START_MAX = 2000;
// Warnings only: long routes and far starts are legal but usually mistakes.
export const MISSION_ROUTE_WARN = 5000;
export const MISSION_FIRST_WARN = 1000;

const EARTH_RADIUS = 6371000;

export function hasCoord(p?: GeoPoint): p is GeoPoint {
  return !!p && (p.lat != 0 || p.lon != 0);
}

// Great-circle distance in meters between two gps_coord_t points.
export function distance(a: GeoPoint, b: GeoPoint) {
  const rad = Math.PI / 180 / COORD_SCALE;
  const dlat = (b.lat - a.lat) * rad;
  const dlon = (b.lon - a.lon) * rad;
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dlon / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.min(Math.sqrt(h), 1));
}

export interface MissionLeg {
  distance: number;
  speed: number;
  time: number;
}

// Legs in flight order: home to the first point when home is known, then
// point to point, and back home for RTH. Wings ignore waypoint speeds and
// fly every leg at cruise speed.
export function missionLegs(
  mission: Mission,
  home: GeoPoint | undefined,
  cruiseSpeed: number,
  waypointSpeeds = true,
): MissionLeg[] {
  const legs: MissionLeg[] = [];
  const leg = (from: GeoPoint, to: GeoPoint, speed: number) => {
    const d = distance(from, to);
    const s = waypointSpeeds && speed > 0 ? speed : cruiseSpeed;
    legs.push({ distance: d, speed: s, time: s > 0 ? d / s : NaN });
  };

  const wps = mission.waypoints;
  if (hasCoord(home) && wps.length) leg(home, wps[0], wps[0].speed);
  for (let i = 1; i < wps.length; i++) leg(wps[i - 1], wps[i], wps[i].speed);
  if (
    hasCoord(home) &&
    wps.length &&
    mission.end_action == MissionEndAction.RTH
  ) {
    leg(wps[wps.length - 1], home, cruiseSpeed);
  }
  return legs;
}

// Points in flight order that missionLegs measures, home first when known.
export function missionRoute(
  mission: Mission,
  home: GeoPoint | undefined,
): GeoPoint[] {
  const wps = mission.waypoints;
  if (!hasCoord(home) || !wps.length) return [...wps];
  return mission.end_action == MissionEndAction.RTH
    ? [home, ...wps, home]
    : [home, ...wps];
}

export interface PathVertex {
  d: number; // meters along missionRoute
  alt: number; // meters above launch
  index?: number; // waypoint reached here
}

// How the firmware changes altitude. Both change it on the way along a leg.
// Multirotors climb in place to start the mission and RTH, and carry on from
// a waypoint reached short of its altitude toward the next one. Wings circle
// a waypoint reached more than climbMargin below it, up to that margin.
export interface VerticalRates {
  climb: number; // m/s
  sink: number;
  climbInPlace: boolean;
  climbMargin: number; // meters
}
export const MULTI_VERTICAL_RATES: VerticalRates = {
  climb: 2,
  sink: 2,
  climbInPlace: true,
  climbMargin: Infinity,
};
export const WING_VERTICAL_RATES: VerticalRates = {
  climb: 3,
  sink: 2,
  climbInPlace: false,
  climbMargin: 10,
};

// Altitude profile of the planned flight, starting on the ground at home
// when it is known. RTH climbs by rthAltitude from where the last waypoint
// was reached and holds it home; the landing is not drawn.
export function missionPath(
  mission: Mission,
  home: GeoPoint | undefined,
  legs: MissionLeg[],
  rates: VerticalRates,
  rthAltitude: number,
): PathVertex[] {
  const wps = mission.waypoints;
  if (!wps.length) return [];
  const fromHome = hasCoord(home);
  const path: PathVertex[] = [];
  let d = 0;
  let alt = fromHome ? 0 : wps[0].alt;
  path.push({ d, alt, index: fromHome ? undefined : 0 });

  const climbInPlace = (target: number) => {
    if (!rates.climbInPlace || target <= alt) return;
    alt = target;
    path.push({ d, alt });
  };
  // Along the leg toward target, at the vertical rate for the leg's speed.
  const fly = (leg: MissionLeg, target: number) => {
    if (target != alt) {
      const rate = target > alt ? rates.climb : rates.sink;
      const reach = (Math.abs(target - alt) / rate) * leg.speed;
      if (!(leg.speed > 0) || !Number.isFinite(leg.time)) {
        // Without a speed the timing is unknown; assume it gets there.
        alt = target;
      } else if (reach < leg.distance) {
        alt = target;
        path.push({ d: d + reach, alt });
      } else {
        alt += (Math.sign(target - alt) * rate * leg.distance) / leg.speed;
      }
    }
    d += leg.distance;
  };
  // At a waypoint: the last one is held at its altitude, others circle up
  // to within the margin before the next leg.
  const arrive = (target: number, index: number, hold: boolean) => {
    const floor = hold ? target : target - rates.climbMargin;
    if (alt < floor || (hold && alt != target)) {
      path.push({ d, alt });
      alt = hold ? target : floor;
    }
    path.push({ d, alt, index });
  };

  const rth = legs.length > (fromHome ? wps.length : wps.length - 1);
  let leg = 0;
  if (fromHome) {
    climbInPlace(wps[0].alt);
    fly(legs[leg++], wps[0].alt);
    arrive(wps[0].alt, 0, wps.length == 1 && !rth);
  }
  for (let i = 1; i < wps.length; i++) {
    fly(legs[leg++], wps[i].alt);
    arrive(wps[i].alt, i, i == wps.length - 1 && !rth);
  }
  if (rth) {
    const target = alt + Math.max(rthAltitude, 0);
    climbInPlace(target);
    fly(legs[leg], target);
    path.push({ d, alt });
  }
  return path;
}

// First distance at which the path reaches an altitude, Infinity if never.
export function pathReach(path: PathVertex[], alt: number) {
  for (let i = 0; i < path.length; i++) {
    const b = path[i];
    if (b.alt < alt) continue;
    const a = path[i - 1];
    if (!a || a.alt >= alt || b.d == a.d) return b.d;
    return a.d + ((alt - a.alt) / (b.alt - a.alt)) * (b.d - a.d);
  }
  return Infinity;
}

// Lowest planned altitude at a distance along the route: a climb in place
// passes through every altitude of its vertical segment.
export function pathAltitude(path: PathVertex[], d: number) {
  let lowest = path.length == 1 ? path[0].alt : NaN;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    if (d < a.d || d > b.d) continue;
    const alt =
      b.d == a.d
        ? Math.min(a.alt, b.alt)
        : a.alt + ((b.alt - a.alt) * (d - a.d)) / (b.d - a.d);
    if (!(alt >= lowest)) lowest = alt;
  }
  return lowest;
}

export interface MissionIssue {
  level: "error" | "warning";
  msg: string;
  index?: number;
}

export function validateMission(
  mission: Mission,
  opts: {
    maxWaypoints: number;
    limits?: MissionLimits;
    reference?: GeoPoint;
    routeDistance: number;
  },
): MissionIssue[] {
  const limits = opts.limits ?? MISSION_DEFAULT_LIMITS;
  const issues: MissionIssue[] = [];
  const wps = mission.waypoints;

  if (!wps.length) {
    issues.push({ level: "error", msg: "Add at least one waypoint." });
  }
  if (opts.maxWaypoints && wps.length > opts.maxWaypoints) {
    issues.push({
      level: "error",
      msg: `The flight controller accepts at most ${opts.maxWaypoints} waypoints.`,
    });
  }

  wps.forEach((wp, index) => {
    const n = index + 1;
    if (
      !Number.isFinite(wp.lat) ||
      !Number.isFinite(wp.lon) ||
      Math.abs(wp.lat) > 90 * COORD_SCALE ||
      Math.abs(wp.lon) > 180 * COORD_SCALE
    ) {
      issues.push({
        level: "error",
        index,
        msg: `#${n}: coordinates out of range.`,
      });
    } else if (!hasCoord(wp)) {
      issues.push({
        level: "error",
        index,
        msg: `#${n}: coordinates are 0, 0.`,
      });
    }
    if (!(wp.alt >= limits.min_alt) || wp.alt > limits.max_alt) {
      issues.push({
        level: "error",
        index,
        msg: `#${n}: altitude must be between ${limits.min_alt} and ${limits.max_alt} m.`,
      });
    }
    if (!(wp.speed >= 0) || wp.speed > limits.max_speed) {
      issues.push({
        level: "error",
        index,
        msg: `#${n}: speed must be between 0 and ${Math.round(limits.max_speed * 3.6)} km/h.`,
      });
    }
  });

  if (wps.length && hasCoord(opts.reference) && hasCoord(wps[0])) {
    const d = distance(opts.reference, wps[0]);
    if (d > MISSION_START_MAX) {
      issues.push({
        level: "warning",
        index: 0,
        msg: `#1 is ${formatDistance(d)} from the craft. The mission will not start more than ${formatDistance(MISSION_START_MAX)} from #1.`,
      });
    } else if (d > MISSION_FIRST_WARN) {
      issues.push({
        level: "warning",
        index: 0,
        msg: `#1 is ${formatDistance(d)} from the craft. Check the mission is for this location.`,
      });
    }
  }
  if (opts.routeDistance > MISSION_ROUTE_WARN) {
    issues.push({
      level: "warning",
      msg: `The route is ${formatDistance(opts.routeDistance)} long. Make sure the battery and link can cover it.`,
    });
  }

  return issues;
}

export function formatDistance(meters: number) {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(2)} km`
    : `${meters.toFixed(0)} m`;
}

export function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds)) return "–";
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Files store degrees so they stay readable and editable by hand.
const FILE_FORMAT = "quicksilver-mission";
const FILE_VERSION = 1;

export function missionToFile(mission: Mission) {
  return JSON.stringify(
    {
      format: FILE_FORMAT,
      version: FILE_VERSION,
      end_action: mission.end_action,
      waypoints: mission.waypoints.map((wp) => ({
        lat: wp.lat / COORD_SCALE,
        lon: wp.lon / COORD_SCALE,
        alt: wp.alt,
        speed: wp.speed,
      })),
    },
    null,
    2,
  );
}

export function missionFromFile(text: string): Mission {
  const file = JSON.parse(text);
  if (file?.format != FILE_FORMAT || !Array.isArray(file.waypoints)) {
    throw new Error("not a mission file");
  }
  if (file.version > FILE_VERSION) {
    throw new Error("mission file is from a newer configurator");
  }
  file.waypoints.forEach((wp, index) => {
    if (
      !Number.isFinite(Number(wp?.lat)) ||
      !Number.isFinite(Number(wp?.lon))
    ) {
      throw new Error(`waypoint ${index + 1} has no valid coordinates`);
    }
  });
  return {
    end_action:
      file.end_action == MissionEndAction.RTH
        ? MissionEndAction.RTH
        : MissionEndAction.Hold,
    waypoints: file.waypoints.map((wp) => ({
      lat: Math.round(Number(wp.lat) * COORD_SCALE),
      lon: Math.round(Number(wp.lon) * COORD_SCALE),
      alt: Number(wp.alt),
      speed: Number(wp.speed ?? 0),
    })),
  };
}
