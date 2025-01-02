import { clientsClaim } from "workbox-core";
import { registerRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;

const cacheUrls = [
  "raw.githubusercontent.com",
  "api.github.com",
  "cors.bubblesort.me",
];

self.__WB_DISABLE_DEV_LOGS = true;
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

clientsClaim();
cleanupOutdatedCaches();

registerRoute(
  ({ url }) => cacheUrls.includes(url.hostname),
  new CacheFirst({
    cacheName: "github-cache",
    matchOptions: {
      ignoreVary: true,
    },
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 5 * 60,
      }),
    ],
  }),
);
precacheAndRoute(self.__WB_MANIFEST);
