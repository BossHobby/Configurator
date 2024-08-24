import { fileURLToPath, URL } from "url";

import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import vue from "@vitejs/plugin-vue";
import { execSync } from "child_process";
import svgLoader from "vite-svg-loader";
import webfontDownload from "vite-plugin-webfont-dl";

const branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trimEnd();

let base = "/";

if (process.env.NODE_ENV === "production") {
  if (
    process.env.DEPLOYMENT === "gh-pages" ||
    process.env.DEPLOYMENT === "local"
  ) {
    if (branch == "develop") {
      base = "/develop/";
    } else {
      base = "/";
    }
  } else {
    base = "/dist/";
  }
}

process.env.VITE_BRANCH_NAME = branch;
process.env.VITE_APP_VERSION = require("./package.json").version;

// https://vitejs.dev/config/
export default defineConfig({
  base: base,
  plugins: [
    vue(),
    svgLoader(),
    webfontDownload([
      "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap",
      "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap",
    ]),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      manifest: {
        name: "QUICKSILVER Configurator",
        short_name: "QUICKSILVER",
        description:
          "Configurator for the QUICKSILVER flight-controller firmware",
        theme_color: "#3c7317",
        icons: [
          {
            src: "pwa.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
        start_url: ".",
        display: "standalone",
        background_color: "#FFFFFF",
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
      workbox: {
        sourcemap: process.env.NODE_ENV !== "production",
        mode: process.env.NODE_ENV,
      },
      injectManifest: {
        globPatterns: [
          "**/*.{css,glb,html,ico,jpg,js,png,svg,txt,webmanifest,woff2}",
        ],
        rollupFormat: "iife",
      },
    }),
  ],
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
