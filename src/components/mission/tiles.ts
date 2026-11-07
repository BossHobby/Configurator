import type { TileCachePolicy } from "@/store/util/tile-cache";

// Every tile request reveals the viewed area to the provider. Planning needs
// a basemap; offline, the map shows viewed areas from the tile cache and
// falls back to its coordinate grid elsewhere.
// Swap a provider here to change it everywhere.
export type TileProvider = "streets" | "satellite";

const DAY = 24 * 60 * 60 * 1000;

export const TILE_PROVIDERS: Record<
  TileProvider,
  { url: string; attribution: string; maxZoom: number; cache: TileCachePolicy }
> = {
  streets: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    // About 7 kB a tile.
    cache: { name: "streets", maxAge: 7 * DAY, maxTiles: 4000 },
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    maxZoom: 19,
    // About 20 kB a tile.
    cache: { name: "satellite", maxAge: 30 * DAY, maxTiles: 2000 },
  },
};

const STORAGE_KEY = "mission-map-tiles";

export function readTileProvider(): TileProvider {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value == "streets" ? value : "satellite";
  } catch {
    return "satellite";
  }
}

export function saveTileProvider(provider: TileProvider) {
  try {
    localStorage.setItem(STORAGE_KEY, provider);
  } catch {
    /* The choice still applies for this session. */
  }
}
