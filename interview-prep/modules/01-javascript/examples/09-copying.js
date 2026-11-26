// Topic 09: shallow copies, deep copies, JSON round-trips and structuredClone.
// Run: node interview-prep/modules/01-javascript/examples/09-copying.js
import assert from "node:assert/strict";

// --- Shallow copies share nested objects ---------------------------------------
const booking = { id: "b1", client: { name: "Ada" }, tags: ["vip"] };
const spread = { ...booking };
const assigned = Object.assign({}, booking);
spread.id = "b2"; // top level: independent
spread.client.name = "Grace"; // nested: shared with the original
assert.equal(booking.id, "b1");
assert.equal(booking.client.name, "Grace");
assert.equal(assigned.client, booking.client);
for (const copy of [[...booking.tags], booking.tags.slice(), Array.from(booking.tags), booking.tags.concat()]) {
  assert.notEqual(copy, booking.tags); // a new array...
  assert.deepEqual(copy, booking.tags); // ...with the same elements
}

// --- JSON round-trip: deep, but lossy ------------------------------------------------
const source = { a: 1, when: new Date(0), fn() {}, sym: Symbol("x"), missing: undefined, list: [1, { b: 2 }] };
const viaJson = JSON.parse(JSON.stringify(source));
assert.deepEqual(Object.keys(viaJson), ["a", "when", "list"]); // fn, sym, missing dropped silently
assert.equal(typeof viaJson.when, "string"); // Date became a string
assert.notEqual(viaJson.list[1], source.list[1]); // nested objects really are new
assert.equal(JSON.stringify([undefined, () => 1, Symbol("s")]), "[null,null,null]"); // in arrays → null
assert.equal(JSON.stringify(new Map([["a", 1]])), "{}"); // Maps vanish
const cyclic = {};
cyclic.self = cyclic;
assert.throws(() => JSON.stringify(cyclic), TypeError); // cycles throw
assert.throws(() => JSON.stringify({ n: 1n }), TypeError); // BigInt throws

// --- structuredClone: deep, keeps more types, handles cycles -----------------------
const original = { name: "MDN", when: new Date(0), tags: new Set(["a"]), prices: new Map([["cut", 3500]]) };
original.itself = original;
const clone = structuredClone(original);
assert.notEqual(clone, original);
assert.equal(clone.itself, clone); // the cycle is rebuilt inside the clone
assert.ok(clone.when instanceof Date);
assert.ok(clone.tags instanceof Set && clone.tags.has("a"));
assert.equal(clone.prices.get("cut"), 3500);
clone.prices.set("cut", 4000);
assert.equal(original.prices.get("cut"), 3500); // fully independent

// Errors are cloneable (name and message kept).
const errClone = structuredClone(new RangeError("too big"));
assert.equal(errClone.name, "RangeError");
assert.equal(errClone.message, "too big");

// What it can't do.
assert.throws(() => structuredClone({ fn() {} }), { name: "DataCloneError" }); // functions
assert.throws(() => structuredClone(Symbol("s")), { name: "DataCloneError" }); // symbols

class Money {
  constructor(cents) {
    this.cents = cents;
  }
  get dollars() {
    return this.cents / 100;
  }
}
const price = structuredClone(new Money(1250));
assert.equal(price instanceof Money, false); // prototype chain not copied → plain object
assert.equal(price.cents, 1250); // own data kept
assert.equal(price.dollars, undefined); // getter (on the prototype) gone

const readonly = Object.defineProperty({}, "fixed", { value: 1, writable: false, enumerable: true });
const unlocked = structuredClone(readonly);
unlocked.fixed = 2; // property descriptors aren't copied: it's writable again
assert.equal(unlocked.fixed, 2);

// Transfer: move an ArrayBuffer instead of copying it. The original becomes unusable.
const bytes = Uint8Array.from({ length: 16 }, (_, i) => i);
const moved = structuredClone(bytes, { transfer: [bytes.buffer] });
assert.equal(bytes.byteLength, 0);
assert.equal(moved.byteLength, 16);

// Q4 from the topic page.
const qa = [{ n: 1 }];
const qb = qa.slice();
qb[0].n = 2;
qb.push({ n: 3 });
assert.deepEqual(qa, [{ n: 2 }]);

// Sets become {} in JSON.
assert.equal(JSON.stringify({ s: new Set([1]) }), '{"s":{}}');

console.log("09-copying: all checks passed");
