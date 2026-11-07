import {
  COORD_SCALE,
  distance,
  pathAltitude,
  type GeoPoint,
  type PathVertex,
} from "./mission.ts";

import { tileCache, type TileCachePolicy } from "./tile-cache.ts";

// Terrarium-encoded elevation tiles from the AWS Terrain Tiles open dataset:
// metres above sea level, mostly SRTM at about 30 m. Like the basemap, every
// request reveals the viewed area to the provider.
export const TERRAIN_URL =
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";
// About 19 m per pixel at the equator, finer than the source data.
export const TERRAIN_ZOOM = 13;
// The data has not changed since 2017; about 120 kB a tile.
export const TERRAIN_CACHE: TileCachePolicy = {
  name: "terrain",
  maxAge: Infinity,
  maxTiles: 400,
};
// The data is bare ground: trees and buildings are not in it, and it is off by
// 10 to 15 m in places. Warn below this much clearance.
export const TERRAIN_CLEARANCE_WARN = 25;

const TILE_SIZE = 256;
// About 256 kB each; enough for a route across a few tens of kilometres.
const CACHE_TILES = 64;

// Terrarium packs metres as R * 256 + G + B / 256 - 32768.
export function decodeTerrarium(rgba: ArrayLike<number>): Float32Array {
  const out = new Float32Array(rgba.length / 4);
  for (let i = 0; i < out.length; i++) {
    out[i] =
      rgba[i * 4] * 256 + rgba[i * 4 + 1] + rgba[i * 4 + 2] / 256 - 32768;
  }
  return out;
}

// Web Mercator position in pixels of the whole world at zoom z.
export function worldPixel(p: GeoPoint, z = TERRAIN_ZOOM) {
  const size = TILE_SIZE * 2 ** z;
  const lat = Math.max(Math.min(p.lat / COORD_SCALE, 85.0511), -85.0511);
  const rad = (lat * Math.PI) / 180;
  return {
    x: ((p.lon / COORD_SCALE + 180) / 360) * size,
    y: ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * size,
  };
}

export type TileLoader = (
  z: number,
  x: number,
  y: number,
) => Promise<Float32Array>;

async function fetchTile(z: number, x: number, y: number) {
  const url = TERRAIN_URL.replace("{z}", String(z))
    .replace("{x}", String(x))
    .replace("{y}", String(y));
  const image = await createImageBitmap(
    await tileCache().get(url, TERRAIN_CACHE),
  );
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = TILE_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0);
  image.close();
  return decodeTerrarium(ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE).data);
}

export class Terrain {
  private tiles = new Map<string, Promise<Float32Array>>();
  private ready = new Map<string, Float32Array>();

  private loader: TileLoader;
  private zoom: number;

  constructor(loader: TileLoader = fetchTile, zoom = TERRAIN_ZOOM) {
    this.loader = loader;
    this.zoom = zoom;
  }

  private key(x: number, y: number) {
    return `${x}/${y}`;
  }

  // Loads every tile the points need, so sampling them is synchronous.
  // Rejects when a tile cannot be loaded; the next call retries it.
  async load(points: GeoPoint[]) {
    const max = 2 ** this.zoom;
    const needed = new Set<string>();
    for (const p of points) {
      const { x, y } = worldPixel(p, this.zoom);
      // Bilinear sampling reads the next pixel, which can be the next tile.
      for (const px of [x, x + 1]) {
        for (const py of [y, y + 1]) {
          const tx = Math.floor(px / TILE_SIZE) % max;
          const ty = Math.min(Math.floor(py / TILE_SIZE), max - 1);
          needed.add(this.key(tx, ty));
        }
      }
    }
    await Promise.all(
      [...needed].map((key) => {
        let tile = this.tiles.get(key);
        if (!tile) {
          const [x, y] = key.split("/").map(Number);
          tile = this.loader(this.zoom, x, y).then(
            (data) => {
              this.ready.set(key, data);
              this.evict();
              return data;
            },
            (err) => {
              this.tiles.delete(key);
              throw err;
            },
          );
          this.tiles.set(key, tile);
        } else if (this.ready.has(key)) {
          // Most recently used last.
          const data = this.ready.get(key)!;
          this.ready.delete(key);
          this.ready.set(key, data);
        }
        return tile;
      }),
    );
  }

  private evict() {
    for (const key of this.ready.keys()) {
      if (this.ready.size <= CACHE_TILES) break;
      this.ready.delete(key);
      this.tiles.delete(key);
    }
  }

  private pixel(x: number, y: number) {
    const max = 2 ** this.zoom;
    const tx = Math.floor(x / TILE_SIZE) % max;
    const ty = Math.min(Math.floor(y / TILE_SIZE), max - 1);
    const tile = this.ready.get(this.key(tx, ty));
    if (!tile) return NaN;
    const px = Math.floor(x) % TILE_SIZE;
    const py = Math.min(Math.floor(y) - ty * TILE_SIZE, TILE_SIZE - 1);
    return tile[py * TILE_SIZE + px];
  }

  // Ground elevation in metres above sea level, NaN until its tiles loaded.
  elevation(p: GeoPoint) {
    const { x, y } = worldPixel(p, this.zoom);
    // Pixel values sit at pixel centres.
    const fx = x - 0.5;
    const fy = y - 0.5;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const dx = fx - x0;
    const dy = fy - y0;
    const top = this.pixel(x0, y0) * (1 - dx) + this.pixel(x0 + 1, y0) * dx;
    const bottom =
      this.pixel(x0, y0 + 1) * (1 - dx) + this.pixel(x0 + 1, y0 + 1) * dx;
    return top * (1 - dy) + bottom * dy;
  }
}

// Points every `step` metres along the polyline, including each vertex, with
// the distance from its start.
export function sampleRoute(route: GeoPoint[], step: number) {
  const out: { point: GeoPoint; d: number }[] = [];
  let d = 0;
  for (let i = 0; i < route.length; i++) {
    if (i == 0) {
      out.push({ point: route[0], d: 0 });
      continue;
    }
    const a = route[i - 1];
    const b = route[i];
    const length = distance(a, b);
    const n = Math.max(1, Math.ceil(length / step));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      out.push({
        point: {
          lat: a.lat + (b.lat - a.lat) * t,
          lon: a.lon + (b.lon - a.lon) * t,
        },
        d: d + length * t,
      });
    }
    d += length;
  }
  return out;
}

export interface ProfileSample {
  d: number; // meters along the route
  ground: number; // meters above the launch point's ground
  flight: number; // lowest planned altitude here, meters above launch
}

// Ground and the planned path on one scale: above the launch point.
export function terrainProfile(
  ground: { d: number; elevation: number }[],
  launchElevation: number,
  path: PathVertex[],
): ProfileSample[] {
  return ground.map(({ d, elevation }) => ({
    d,
    ground: elevation - launchElevation,
    flight: pathAltitude(path, d),
  }));
}

// Lowest clearance over (from, to], skipping the climb out from the ground.
export function lowestClearance(
  profile: ProfileSample[],
  from: number,
  to: number,
  takeoff: number,
) {
  let lowest: ProfileSample | undefined;
  for (const s of profile) {
    if (s.d <= from || s.d > to || s.d <= takeoff) continue;
    if (!lowest || s.flight - s.ground < lowest.flight - lowest.ground)
      lowest = s;
  }
  return lowest && { d: lowest.d, clearance: lowest.flight - lowest.ground };
}
