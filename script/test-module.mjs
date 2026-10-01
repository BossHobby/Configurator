import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
export function loadModule(path, imports = {}, globals = {}) {
  // HMR is a Vite-only concern; strip the trailing singleton in protocol tests.
  const source = readFileSync(new URL(path, import.meta.url), "utf8").split(
    "// Keep the transport alive",
  )[0];
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const exports = {};
  runInNewContext(outputText, {
    exports,
    require(name) {
      assert.ok(name in imports, `Unexpected import: ${name}`);
      return imports[name];
    },
    TransformStream,
    Uint8Array,
    DataView,
    TypeError,
    Error,
    URL,
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    ...globals,
  });
  return exports;
}
