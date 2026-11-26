// Topic 10: any vs unknown vs never vs void vs object, and validating outside data.
import assert from "node:assert/strict";

// --- 1. any turns checking OFF, and spreads ------------------------------------
const obj: any = { x: 0 };
assert.throws(() => obj.foo(), TypeError); // compiles; crashes at runtime
const spread: string = obj.whatever; // any flows into typed code silently
assert.equal(spread, undefined);

// --- 2. unknown accepts anything but allows nothing until you narrow ------------------
function safeParse(s: string): unknown {
  return JSON.parse(s);
}
const data = safeParse('{"amountMinor": 2500, "currency": "GBP"}');
// @ts-expect-error TS18046 — 'data' is of type 'unknown'
data.amountMinor;

// Narrow at the boundary, return a real type afterwards.
interface Money {
  amountMinor: number;
  currency: string;
}
function isMoney(v: unknown): v is Money {
  return (
    typeof v === "object" &&
    v !== null &&
    "amountMinor" in v &&
    Number.isInteger(v.amountMinor) && // `in` narrowed v to have amountMinor: unknown
    "currency" in v &&
    typeof v.currency === "string"
  );
}
assert.equal(isMoney(data), true);
assert.equal(isMoney({ amountMinor: 25.5, currency: "GBP" }), false); // floats rejected
assert.equal(isMoney(null), false);
if (isMoney(data)) assert.equal(data.amountMinor, 2500);

// Assignability: anything → unknown; unknown → only unknown/any.
const u: unknown = 42;
// @ts-expect-error TS2322 — unknown isn't assignable to number without narrowing
const num: number = u;
const anyOk: any = u;
assert.equal(num + anyOk, 84);

// --- 3. never: no value. Functions that never return, and "nothing left" -----------------
function fail(msg: string): never {
  throw new Error(msg);
}
assert.throws(() => fail("boom"), /boom/);
const nv = (() => {
  // never is assignable to every type...
  const x: string = (null as unknown as never);
  return x;
})();
assert.equal(nv, null);
// ...but nothing (except never) is assignable to never.
// @ts-expect-error TS2322 — string isn't assignable to never
const nothing: never = "x";
assert.equal(nothing, "x");

// --- 4. void: "the return value isn't meant to be used" — not the same as undefined ---------
function log(msg: string): void {
  void msg;
}
const r = log("hi");
// @ts-expect-error TS1345 — an expression of type 'void' can't be tested for truthiness
if (r) assert.fail();
const undef: undefined = undefined;
const v: void = undef; // undefined → void is allowed
assert.equal(v, undefined);

// --- 5. object vs {} vs Object ----------------------------------------------------------------
function takesObject(o: object) {
  return typeof o;
}
// @ts-expect-error TS2345 — object means NON-primitive
takesObject(42);
assert.equal(takesObject([]), "object");
assert.equal(takesObject(() => 1), "function"); // functions are objects
const braces: {} = 42; // {} accepts every value except null and undefined
// @ts-expect-error TS2322 — null isn't assignable to {}
const nope: {} = null;
assert.equal(typeof braces + String(nope), "numbernull");

// --- 6. Function: avoid; returns any ------------------------------------------------------------
function doSomething(f: Function) {
  return f(1, 2, 3); // untyped call: result is any
}
assert.equal(doSomething(() => "ok"), "ok");
function better(f: () => void) {
  f(); // when you just need "some function you call"
}
better(() => 1);

console.log("10 unknown/any/never/void: all checks passed");
