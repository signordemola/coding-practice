// Topic 08: Map, Set, WeakMap, WeakSet.
// The tools only. The counting / duplicates / two-sum / top-K patterns are practised in
// lesson-04 (no solutions are kept in this repo), so they are not solved here.
// Run: node interview-prep/modules/01-javascript/examples/08-map-set-weak.js
import assert from "node:assert/strict";

// --- Map basics -----------------------------------------------------------------
const sayings = new Map();
sayings.set("dog", "woof").set("cat", "meow").set("elephant", "toot"); // set() returns the map
assert.equal(sayings.size, 3);
assert.equal(sayings.get("dog"), "woof");
assert.equal(sayings.get("fox"), undefined);
assert.equal(sayings.has("bird"), false);
assert.equal(sayings.delete("dog"), true);
assert.equal(sayings.delete("dog"), false); // nothing left to delete
assert.deepEqual([...sayings], [
  ["cat", "meow"],
  ["elephant", "toot"],
]);

// Insertion order is kept; re-setting an existing key doesn't move it.
const order = new Map([
  ["a", 1],
  ["b", 2],
]);
order.set("a", 97);
assert.deepEqual([...order.keys()], ["a", "b"]);

// forEach passes (value, key): value FIRST.
const pairs = [];
order.forEach((value, key) => pairs.push(`${key}=${value}`));
assert.deepEqual(pairs, ["a=97", "b=2"]);

// Any value can be a key. Objects are compared by identity, not contents.
const keyObj = {};
const keyFunc = () => {};
const m = new Map([
  [keyObj, "object key"],
  [keyFunc, "function key"],
  [1, "number one"],
  ["1", "string one"],
]);
assert.equal(m.get(keyObj), "object key");
assert.equal(m.get({}), undefined); // a different object
assert.equal(m.get(1), "number one");
assert.equal(m.get("1"), "string one"); // 1 and "1" stay different keys in a Map

// A plain object turns every key into a string, so 1 and "1" collide.
const plain = {};
plain[1] = "number one";
plain["1"] = "string one";
assert.deepEqual(Object.keys(plain), ["1"]);
assert.equal(plain[1], "string one");

// NaN works as a key (SameValueZero).
const nanMap = new Map([[NaN, "not a number"]]);
assert.equal(nanMap.get(Number("foo")), "not a number");

// The bracket-notation trap: it sets an object property, not a Map entry.
const wrongMap = new Map();
wrongMap["bla"] = "blaa";
assert.equal(wrongMap.has("bla"), false);
assert.equal(wrongMap.size, 0);

// Objects inherit keys from their prototype; a Map has none.
const counts = {};
assert.equal("toString" in counts, true); // surprise "key"
assert.equal(new Map().has("toString"), false);

// Converting between arrays, objects and Maps.
const kvArray = [
  ["key1", "value1"],
  ["key2", "value2"],
];
const fromArray = new Map(kvArray);
assert.deepEqual(Array.from(fromArray), kvArray);
assert.deepEqual(Object.fromEntries(fromArray), { key1: "value1", key2: "value2" });
assert.deepEqual(new Map(Object.entries({ x: 1 })).get("x"), 1);

// Clone (shallow) and merge (last key wins).
const original = new Map([[1, "one"]]);
const clone = new Map(original);
assert.notEqual(clone, original);
const merged = new Map([
  ...new Map([
    [1, "one"],
    [2, "two"],
    [3, "three"],
  ]),
  ...new Map([
    [1, "uno"],
    [2, "dos"],
  ]),
]);
assert.deepEqual([...merged.values()], ["uno", "dos", "three"]);

// JSON.stringify doesn't understand Maps.
assert.equal(JSON.stringify(new Map([["a", 1]])), "{}");
assert.equal(JSON.stringify(Object.fromEntries(new Map([["a", 1]]))), '{"a":1}');

// --- Set basics ------------------------------------------------------------------
const mySet = new Set();
mySet.add(1).add(5).add(5).add("some text");
const o = { a: 1, b: 2 };
mySet.add(o).add({ a: 1, b: 2 }); // a different object, so both stay
assert.equal(mySet.size, 5);
assert.equal(mySet.has(Math.sqrt(25)), true);
assert.equal(mySet.has({ a: 1, b: 2 }), false); // identity, not contents
mySet.delete(5);
mySet.add(5); // re-added: goes to the END
assert.deepEqual([...mySet].at(-1), 5);

// Remove duplicates while keeping first-seen order (MDN example).
assert.deepEqual(
  [...new Set([2, 13, 4, 4, 2, 13, 13, 4, 4, 5, 5, 6, 6, 7, 5, 32, 13, 4, 5])],
  [2, 13, 4, 5, 6, 7, 32],
);
assert.equal(new Set("firefox").size, 6); // strings iterate by character

// Set composition methods (take any set-like argument: size, has(), keys()).
const A = new Set([1, 2, 3, 4]);
const C = new Set([3, 4, 5, 6]);
assert.deepEqual([...A.union(C)], [1, 2, 3, 4, 5, 6]);
assert.deepEqual([...A.intersection(C)], [3, 4]);
assert.deepEqual([...A.difference(C)], [1, 2]);
assert.deepEqual([...A.symmetricDifference(C)], [1, 2, 5, 6]);
assert.equal(new Set([2, 3]).isSubsetOf(A), true);
assert.equal(A.isSupersetOf(new Set([2, 3])), true);
assert.equal(A.isDisjointFrom(new Set([9])), true);
// A Map is set-like (its keys are used).
assert.deepEqual(
  [
    ...new Set([1, 2, 3]).union(
      new Map([
        [1, "one"],
        [4, "four"],
      ]),
    ),
  ],
  [1, 2, 3, 4],
);
// An array is not set-like: wrap it first.
assert.throws(() => A.union([7]), TypeError);
assert.deepEqual([...A.union(new Set([7]))], [1, 2, 3, 4, 7]);

// indexOf can't find NaN; a Set can.
assert.equal([NaN].indexOf(NaN), -1);
assert.equal(new Set([NaN]).has(NaN), true);

// --- WeakMap / WeakSet -----------------------------------------------------------
const wm = new WeakMap();
const k1 = {};
wm.set(k1, 37);
assert.equal(wm.get(k1), 37);
wm.set(k1, undefined);
assert.equal(wm.has(k1), true); // has() is true even when the value is undefined
assert.throws(() => wm.set("a string", 1), TypeError); // keys must be objects (or unregistered symbols)
assert.equal(typeof wm.keys, "undefined"); // not enumerable: no keys(), size or clear()
assert.equal("size" in wm, false);
wm.set(Symbol("ok"), 1); // a non-registered symbol is allowed
assert.throws(() => wm.set(Symbol.for("registered"), 1), TypeError); // can be re-created, so not allowed

// Private data per object (the pre-#private pattern).
const privates = new WeakMap();
class Thing {
  constructor() {
    privates.set(this, { hidden: 1 });
  }
  showPrivate() {
    return privates.get(this).hidden;
  }
}
const thing = new Thing();
assert.equal(thing.showPrivate(), 1);
assert.deepEqual(Object.keys(thing), []);

// Cache by object input: entry disappears with the object.
const cache = new WeakMap();
let computeCalls = 0;
function totalCents(order) {
  if (cache.has(order)) return cache.get(order);
  computeCalls++;
  const result = order.lines.reduce((sum, line) => sum + line.cents, 0);
  cache.set(order, result);
  return result;
}
const orderA = { lines: [{ cents: 1500 }, { cents: 2500 }] };
assert.equal(totalCents(orderA), 4000);
assert.equal(totalCents(orderA), 4000);
assert.equal(computeCalls, 1);

// WeakSet: tag objects without keeping them alive.
const handled = new WeakSet();
const event = {};
handled.add(event);
assert.equal(handled.has(event), true);

// Map.prototype.getOrInsert / getOrInsertComputed: listed on MDN, but NOT in Node 22.
// They're checked only if this Node version has them (the repo targets Node 26).
if (typeof Map.prototype.getOrInsert === "function") {
  const g = new Map();
  assert.equal(g.getOrInsert("a", 1), 1);
  assert.equal(g.getOrInsert("a", 2), 1);
  assert.equal(g.getOrInsertComputed("b", (key) => key.toUpperCase()), "B");
  console.log("  (getOrInsert checked on this Node version)");
} else {
  console.log(`  (getOrInsert not available on Node ${process.versions.node}: skipped)`);
}

console.log("08-map-set-weak: all checks passed");
