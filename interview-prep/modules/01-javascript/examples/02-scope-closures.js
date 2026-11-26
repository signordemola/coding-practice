// Topic 02: scope, hoisting, TDZ and closures.
// Run: node interview-prep/modules/01-javascript/examples/02-scope-closures.js
import assert from "node:assert/strict";

// --- Hoisting -------------------------------------------------------------
// Function declarations are usable before their line (hoisting type 1).
assert.equal(early(), "works");
function early() {
  return "works";
}

// var is hoisted with the value undefined (type 2).
function varDemo() {
  const before = x;
  var x = 5;
  return [before, x];
}
assert.deepEqual(varDemo(), [undefined, 5]);

// let/const/class are in the Temporal Dead Zone until their line runs (type 3).
assert.throws(() => {
  tdz;
  let tdz = 1;
}, ReferenceError);

// The TDZ even breaks typeof, which is normally safe for undeclared names.
assert.equal(typeof neverDeclared, "undefined");
assert.throws(() => {
  typeof inTdz;
  let inTdz = 1;
}, ReferenceError);

// "Temporal": it's about WHEN the code runs, not where it's written.
{
  const readLater = () => later; // defined before, called after: fine
  const later = "ok";
  assert.equal(readLater(), "ok");
}

// The inner declaration "taints" the whole block: the outer x is not visible.
const shadowed = 1;
assert.throws(() => {
  {
    shadowed; // refers to the inner one, still in TDZ
    const shadowed = 2;
  }
}, ReferenceError);

// --- Block scope vs function scope -----------------------------------------
function blockScope() {
  if (true) {
    var fnScoped = "var leaks out of the block";
    let blockScoped = "let stays inside";
  }
  return [fnScoped, typeof blockScoped];
}
assert.deepEqual(blockScope(), ["var leaks out of the block", "undefined"]);

for (var i = 0; i < 3; i++) {}
assert.equal(i, 3); // var i is still visible after the loop

// switch cases share ONE block, so the same let in two cases is a SyntaxError.
// (Can't run a SyntaxError inside this file, so we compile it on the fly.)
assert.throws(
  () => new Function("x", "switch (x) { case 0: let a = 1; break; case 1: let a = 2; }"),
  SyntaxError,
);
// Fix: give each case its own block.
new Function("x", "switch (x) { case 0: { let a = 1; break; } case 1: { let a = 2; } }");

// --- Closures ---------------------------------------------------------------
function makeAdder(x) {
  return (y) => x + y;
}
const add5 = makeAdder(5);
const add10 = makeAdder(10);
assert.equal(add5(2), 7);
assert.equal(add10(2), 12); // same body, different environments

// Private state: only the returned functions can touch count.
function makeCounter() {
  let count = 0;
  return {
    increment: () => ++count,
    value: () => count,
  };
}
const c1 = makeCounter();
const c2 = makeCounter();
c1.increment();
c1.increment();
assert.equal(c1.value(), 2);
assert.equal(c2.value(), 0); // independent environment
assert.equal("count" in c1, false);

// Closures over ALL outer scopes (the scope chain).
const e = 10;
const sum = (a) => (b) => (c) => (d) => a + b + c + d + e;
assert.equal(sum(1)(2)(3)(4), 20);

// Closures over a block-scoped variable outlive the block.
let getY;
{
  const y = 6;
  getY = () => y;
}
assert.equal(getY(), 6);

// --- The loop trap, without timers so it's easy to test --------------------
const withVar = [];
for (var j = 0; j < 3; j++) withVar.push(() => j);
assert.deepEqual(
  withVar.map((f) => f()),
  [3, 3, 3],
); // one shared j

const withLet = [];
for (let k = 0; k < 3; k++) withLet.push(() => k);
assert.deepEqual(
  withLet.map((f) => f()),
  [0, 1, 2],
); // a new k per iteration

// Same thing with timers (the version interviewers show).
const logged = [];
await new Promise((done) => {
  for (var t = 0; t < 3; t++) setTimeout(() => logged.push(t));
  setTimeout(done);
});
assert.deepEqual(logged, [3, 3, 3]);

// Closures read the CURRENT value of the variable, not a snapshot.
let price = 50;
const readPrice = () => price;
price = 60;
assert.equal(readPrice(), 60);

// const stops reassignment, not mutation (checked by running, not an MDN page in this module).
const b = {};
b.x = 1;
assert.equal(b.x, 1);
assert.throws(() => new Function("const c = 1; c = 2;")(), TypeError);

console.log("02-scope-closures: all checks passed");
