import { test } from "node:test";
import assert from "node:assert/strict";
import { TileCache } from "../src/store/util/tile-cache.ts";

const DAY = 24 * 60 * 60 * 1000;
const policy = { name: "streets", maxAge: 7 * DAY, maxTiles: 60 };

function memoryStore() {
  const entries = new Map();
  return {
    entries,
    get: async (url) => entries.get(url),
    put: async (entry) => void entries.set(entry.url, entry),
    count: async (cache) =>
      [...entries.values()].filter((e) => e.cache == cache).length,
    evict: async (cache, n) => {
      [...entries.values()]
        .filter((e) => e.cache == cache)
        .sort((a, b) => a.used - b.used)
        .slice(0, n)
        .forEach((e) => entries.delete(e.url));
    },
  };
}

function network() {
  const net = { online: true, requests: [] };
  net.fetch = async (url) => {
    net.requests.push(url);
    if (!net.online) throw new TypeError("Failed to fetch");
    return new Response(`tile ${url} #${net.requests.length}`, {
      headers: { "content-type": "image/png" },
    });
  };
  return net;
}

const text = (blob) => blob.text();
const settle = () => new Promise((r) => setTimeout(r, 0));

test("fresh tiles come from the cache", async () => {
  const store = memoryStore();
  const net = network();
  let now = 1000;
  const cache = new TileCache(Promise.resolve(store), net.fetch, () => now);
  const first = await cache.get("a", policy);
  assert.equal(first.type, "image/png");
  await settle();
  now += DAY;
  assert.equal(await text(await cache.get("a", policy)), await text(first));
  assert.equal(net.requests.length, 1);
});

test("stale tiles are refreshed online and served offline", async () => {
  const store = memoryStore();
  const net = network();
  let now = 1000;
  const cache = new TileCache(Promise.resolve(store), net.fetch, () => now);
  const first = await text(await cache.get("a", policy));
  await settle();
  now += 8 * DAY;
  net.online = false;
  assert.equal(await text(await cache.get("a", policy)), first);
  net.online = true;
  assert.equal(await text(await cache.get("a", policy)), "tile a #3");
  await settle();
  assert.equal(store.entries.get("a").fetched, now);
});

test("tiles never seen fail offline", async () => {
  const net = network();
  net.online = false;
  const cache = new TileCache(Promise.resolve(memoryStore()), net.fetch);
  await assert.rejects(cache.get("a", policy));
});

test("concurrent requests for a tile share one fetch", async () => {
  const net = network();
  const cache = new TileCache(Promise.resolve(memoryStore()), net.fetch);
  await Promise.all([cache.get("a", policy), cache.get("a", policy)]);
  assert.equal(net.requests.length, 1);
});

test("least recently used tiles are evicted past the limit", async () => {
  const store = memoryStore();
  const net = network();
  let now = 0;
  const cache = new TileCache(Promise.resolve(store), net.fetch, () => now);
  for (let i = 0; i < 100; i++) {
    now = i * 2 * DAY;
    await cache.get(`t${i}`, policy);
    await settle();
  }
  // Trimmed after the 50th and 100th new tile.
  assert.equal(store.entries.size, policy.maxTiles);
  assert.ok(!store.entries.has("t0"));
  assert.ok(store.entries.has("t99"));
});

test("without storage tiles still load from the network", async () => {
  const net = network();
  const cache = new TileCache(Promise.reject(new Error("no idb")), net.fetch);
  assert.equal(await text(await cache.get("a", policy)), "tile a #1");
});

test("http errors are not cached", async () => {
  const store = memoryStore();
  const cache = new TileCache(
    Promise.resolve(store),
    async () => new Response("", { status: 404 }),
  );
  await assert.rejects(cache.get("a", policy));
  assert.equal(store.entries.size, 0);
});
