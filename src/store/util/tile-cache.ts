// Map and terrain tiles kept across sessions, for planning without a
// connection. IndexedDB works wherever the app runs: browsers, Electron's
// file:// page and the Capacitor web views, which have no service worker.
// It is also outside the caches the service worker clears on update.

export interface TileCachePolicy {
  name: string;
  // Older tiles are fetched again when online, and still served offline.
  maxAge: number; // ms
  maxTiles: number;
}

export interface TileEntry {
  url: string;
  cache: string;
  data: ArrayBuffer;
  type: string;
  fetched: number; // ms since epoch
  used: number;
}

export interface TileStore {
  get(url: string): Promise<TileEntry | undefined>;
  put(entry: TileEntry): Promise<void>;
  count(cache: string): Promise<number>;
  // Deletes the n least recently used tiles of a cache.
  evict(cache: string, n: number): Promise<void>;
}

// Bump "used" at most this often, so reading a tile rarely writes.
const TOUCH_INTERVAL = 24 * 60 * 60 * 1000;
// Trim a cache after this many new tiles.
const TRIM_EVERY = 50;

export class TileCache {
  private pending = new Map<string, Promise<Blob>>();
  private added = new Map<string, number>();
  private store: Promise<TileStore | undefined>;
  private fetcher: typeof fetch;
  private now: () => number;

  constructor(
    store: Promise<TileStore | undefined>,
    fetcher: typeof fetch = (...args) => fetch(...args),
    now = () => Date.now(),
  ) {
    // Without storage, tiles are fetched as if there were no cache.
    this.store = store.catch(() => undefined);
    this.fetcher = fetcher;
    this.now = now;
  }

  // The tile, from the cache while fresh, else the network, else a stale
  // copy. Rejects when neither has it.
  get(url: string, policy: TileCachePolicy): Promise<Blob> {
    let tile = this.pending.get(url);
    if (!tile) {
      tile = this.load(url, policy).finally(() => this.pending.delete(url));
      this.pending.set(url, tile);
    }
    return tile;
  }

  private async load(url: string, policy: TileCachePolicy) {
    const store = await this.store;
    const entry = await store?.get(url).catch(() => undefined);
    const now = this.now();
    if (entry && now - entry.fetched < policy.maxAge) {
      if (now - entry.used > TOUCH_INTERVAL) {
        store!.put({ ...entry, used: now }).catch(() => {});
      }
      return new Blob([entry.data], { type: entry.type });
    }

    let res: Response;
    try {
      res = await this.fetcher(url);
      if (!res.ok) throw new Error(`${url}: ${res.status}`);
    } catch (err) {
      if (entry) return new Blob([entry.data], { type: entry.type });
      throw err;
    }
    const data = await res.arrayBuffer();
    const type = res.headers.get("content-type") ?? "image/png";
    if (store) {
      store
        .put({ url, cache: policy.name, data, type, fetched: now, used: now })
        .then(() => this.trim(store, policy))
        .catch(() => {});
    }
    return new Blob([data], { type });
  }

  private async trim(store: TileStore, policy: TileCachePolicy) {
    const added = (this.added.get(policy.name) ?? 0) + 1;
    this.added.set(policy.name, added % TRIM_EVERY);
    if (added < TRIM_EVERY) return;
    const over = (await store.count(policy.name)) - policy.maxTiles;
    if (over > 0) await store.evict(policy.name, over);
  }
}

function request<T>(req: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const STORE = "tiles";
const BY_USE = "cache-used";

export async function openTileStore(
  name = "tile-cache",
): Promise<TileStore | undefined> {
  if (typeof indexedDB == "undefined") return undefined;
  const open = indexedDB.open(name, 1);
  open.onupgradeneeded = () => {
    const tiles = open.result.createObjectStore(STORE, { keyPath: "url" });
    tiles.createIndex(BY_USE, ["cache", "used"]);
  };
  const db = await request(open);
  const tx = (mode: IDBTransactionMode) =>
    db.transaction(STORE, mode).objectStore(STORE);
  const range = (cache: string) =>
    IDBKeyRange.bound([cache, -Infinity], [cache, Infinity]);

  return {
    get: (url) => request(tx("readonly").get(url)),
    put: async (entry) => {
      await request(tx("readwrite").put(entry));
    },
    count: (cache) => request(tx("readonly").index(BY_USE).count(range(cache))),
    evict: (cache, n) =>
      new Promise((resolve, reject) => {
        const cursor = tx("readwrite").index(BY_USE).openCursor(range(cache));
        cursor.onerror = () => reject(cursor.error);
        cursor.onsuccess = () => {
          const c = cursor.result;
          if (!c || n-- <= 0) return resolve();
          c.delete();
          c.continue();
        };
      }),
  };
}

// One cache for the app, opened on first use.
let shared: TileCache | undefined;
export function tileCache() {
  shared ??= new TileCache(openTileStore());
  return shared;
}
