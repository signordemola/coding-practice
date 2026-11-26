// Topic 02, sloppy-mode part. A .cjs file is CommonJS, which is NOT strict by default,
// so it shows the old behaviours that modules (always strict) don't allow.
// Run: node interview-prep/modules/01-javascript/examples/02-sloppy-globals.cjs
const assert = require("node:assert/strict");

// var x = y = 1 only declares x. y is assigned without a declaration → implicit global.
function leaky() {
  var x = (y = 1);
  return x;
}
leaky();
assert.equal(globalThis.y, 1);
delete globalThis.y;

// In strict mode the same code throws instead of creating a global.
function strictLeaky() {
  "use strict";
  var x = (z = 1);
  return x;
}
assert.throws(strictLeaky, ReferenceError);

// In CommonJS, top-level `this` is module.exports, not globalThis (MDN `this` page).
assert.equal(this, module.exports);

console.log("02-sloppy-globals: all checks passed");
