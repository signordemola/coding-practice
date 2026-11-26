// Topic 03, sloppy-mode part: "this substitution" (MDN `this` page).
// CommonJS files are not strict by default, so they show the old behaviour.
// Run: node interview-prep/modules/01-javascript/examples/03-this-sloppy.cjs
const assert = require("node:assert/strict");

function getThis() {
  return this;
}

// A plain call in sloppy code: undefined is substituted with globalThis.
assert.equal(getThis(), globalThis);

// A primitive `this` is boxed into its wrapper object.
assert.equal(typeof getThis.call(7), "object");
assert.equal(Object.prototype.toString.call(getThis.call(7)), "[object Number]");
assert.equal(Object.prototype.toString.call(getThis.call("foo")), "[object String]");

// The same function in strict mode keeps primitives and undefined as they are.
function getThisStrict() {
  "use strict";
  return this;
}
assert.equal(getThisStrict(), undefined);
assert.equal(getThisStrict.call(7), 7);

// The setTimeout trap: a regular callback runs with this = something other than your object.
// In Node, setTimeout calls the callback with this = the Timeout object, so count isn't found.
// (Browsers use window instead; either way it's not `obj`.)
const obj = {
  count: 10,
  later(done) {
    setTimeout(function () {
      this.count++;
      done(this.count);
    }, 0);
  },
  laterArrow(done) {
    setTimeout(() => {
      this.count++;
      done(this.count);
    }, 0);
  },
};

obj.later((value) => {
  assert.ok(Number.isNaN(value)); // undefined + 1 → NaN
  obj.laterArrow((value2) => {
    assert.equal(value2, 11);
    console.log("03-this-sloppy: all checks passed");
  });
});
