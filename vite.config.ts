import { fileURLToPath, URL } from "url";

import { defineConfig } from "vite";
import { createVuePlugin as vue } from "vite-plugin-vue2";

let base = "/";

if (process.env.NODE_ENV === "production") {
  if (process.env.DEPLOYMENT === "gh-pages") {
    base = "/";
  } else {
    base = "/dist/";
  }
}

process.env.VITE_APP_VERSION = require("./package.json").version;

// https://vitejs.dev/config/
export default defineConfig({
  base: base,
  plugins: [vue()],
  server: {
    port: 8080,
  },
  resolve: {
    alias: {
      "node-fetch": "isomorphic-fetch",
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  define: {
    "process.env": {},
  },
});
