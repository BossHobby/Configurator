import { fileURLToPath, URL } from "url";

import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import vue from "@vitejs/plugin-vue";

let base = "/";

if (process.env.NODE_ENV === "production") {
  if (
    process.env.DEPLOYMENT === "gh-pages" ||
    process.env.DEPLOYMENT === "local"
  ) {
    base = "/";
  } else {
    base = "/dist/";
  }
}

process.env.VITE_APP_VERSION = require("./package.json").version;

// https://vitejs.dev/config/
export default defineConfig({
  base: base,
  plugins: [
    vue({
      template: {
        compilerOptions: {
          compatConfig: {
            MODE: 3,
          },
        },
      }
    }),
    VitePWA({
      includeAssets: [
        "favicon.svg",
        "favicon.ico",
        "robots.txt",
        "apple-touch-icon.png",
      ],
      manifest: {
        name: "QUICKSILVER Configurator",
        short_name: "QUICKSILVER",
        description:
          "Configurator for the QUICKSILVER flight-controller firmware",
        theme_color: "#3c7317",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        start_url: ".",
        display: "standalone",
        background_color: "#FFFFFF",
      },
    }),
  ],
  server: {
    port: 8080,
  },
  resolve: {
    alias: {
      vue: "@vue/compat",
      "node-fetch": "isomorphic-fetch",
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  define: {
    "process.env": {},
  },
});
