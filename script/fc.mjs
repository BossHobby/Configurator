#!/usr/bin/env node
// Bundles cli/fc.ts with the configurator's protocol code and runs it.
// Usage: node script/fc.mjs --help
import { build } from "esbuild";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const outfile = root + "node_modules/.cache/fc/fc.mjs";

await build({
  absWorkingDir: root,
  entryPoints: ["cli/fc.ts"],
  outfile,
  bundle: true,
  // Load npm packages from node_modules; some are CommonJS.
  packages: "external",
  platform: "node",
  format: "esm",
  target: "node22",
  alias: { "@": root + "src" },
  define: { "import.meta.env.DEV": "false", "import.meta.hot": "undefined" },
  logLevel: "error",
});

await import(pathToFileURL(outfile).href);
