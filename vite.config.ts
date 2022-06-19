import { fileURLToPath, URL } from "url";

import { defineConfig } from "vite";
import { createVuePlugin as vue } from "vite-plugin-vue2";

let publicPath = "/";

if (process.env.NODE_ENV === "production") {
  if (process.env.DEPLOYMENT === "gh-pages") {
    publicPath = "/";
  } else {
    publicPath = "/dist/";
  }
}

process.env.VUE_APP_VERSION = require("./package.json").version;

// https://vitejs.dev/config/
export default defineConfig({
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
