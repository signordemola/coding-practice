// Topic 10: ES modules: live bindings, caching, evaluation order, cycles, top-level await,
// CommonJS interop, JSON modules, import.meta. The helper modules live in ./10-modules/.
// Run: node interview-prep/modules/01-javascript/examples/10-modules.js
import assert from "node:assert/strict";
import * as counter from "./10-modules/counter.js";
import { count, increment } from "./10-modules/counter.js";
import valueDefault, { liveDefault, change } from "./10-modules/defaults.js";
import rectangle from "./10-modules/rectangle.cjs";
import compiled from "./10-modules/compiled-default.cjs";
import colors from "./10-modules/colors.json" with { type: "json" };

// --- Live, read-only bindings -----------------------------------------------------
assert.equal(count, 0);
increment();
assert.equal(count, 1); // the import sees the exporter's change
assert.throws(() => {
  // Imports are read-only for the importer (like const).
  new Function("ns", "'use strict'; ns.count = 5;")(counter);
}, TypeError);

// `export default value` captured "first"; `export { x as default }`-style exports stay live.
change();
assert.equal(valueDefault, "first");
assert.equal(liveDefault, "second");

// --- Module caching: one instance per resolved URL (+ type) ---------------------
const again = await import("./10-modules/counter.js");
assert.equal(again, counter); // same namespace object
again.increment();
assert.equal(counter.count, 2); // shared state
const separate = await import("./10-modules/counter.js?fresh=1"); // different URL → new instance
assert.notEqual(separate, counter);
assert.equal(separate.count, 0);

// --- Evaluation order: dependencies first, in source order, before the importer ----
const { log } = await import("./10-modules/order/log.js");
await import("./10-modules/order/main.js");
assert.deepEqual(log, ["first body", "second body", "main body"]);

// --- Cycles -------------------------------------------------------------------------
// Reading an uninitialised const across a cycle during evaluation throws.
await assert.rejects(import("./10-modules/cycle-bad/a.js"), ReferenceError);
// Function declarations survive cycles: they're initialised at link time.
const { fiveIsEven } = await import("./10-modules/cycle-functions/b.js");
assert.equal(fiveIsEven, false);

// --- Top-level await reorders siblings ----------------------------------------------
// entry.js imports setup.js (which waits for settings.js) and then display.js.
// display.js doesn't depend on setup.js, so it runs first and sees no locale yet.
await import("./10-modules/tla/entry.js");
assert.equal(globalThis.displayed, undefined);
assert.equal(globalThis.appLocale, "en-US"); // set later, once settings.js resolved

// --- CommonJS interop ---------------------------------------------------------------
assert.equal(rectangle.area(3, 4), 12); // default import = module.exports
assert.equal(typeof compiled, "object"); // a transpiled `export default` is NOT the function...
assert.equal(compiled.default(4), 16); // ...it sits on .default

// --- JSON modules and import.meta ---------------------------------------------------
assert.equal(colors.blue, "#5499C7");
assert.ok(import.meta.url.startsWith("file://"));
assert.equal(typeof import.meta.dirname, "string"); // Node-specific
const nextToMe = new URL("./10-modules/colors.json", import.meta.url);
assert.ok(nextToMe.pathname.endsWith("/10-modules/colors.json")); // resolved relative to THIS module

// --- Dynamic import returns the namespace object ------------------------------------
const ns = await import("./10-modules/rectangle.cjs");
assert.equal(ns.default.area(2, 5), 10);

console.log("10-modules: all checks passed");
