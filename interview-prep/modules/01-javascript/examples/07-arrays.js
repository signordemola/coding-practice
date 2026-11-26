// Topic 07: arrays: indices and length, empty slots, copying vs mutating, iteration, sort, groupBy.
// Run: node interview-prep/modules/01-javascript/examples/07-arrays.js
import assert from "node:assert/strict";

// --- Indices are strings; only canonical integer strings are elements ---------
const years = [1950, 1960, 1970];
years["02"] = "not an element";
assert.equal(years[2], 1970);
assert.notEqual(years["2"], years["02"]);
assert.equal(years.length, 3); // "02" is a plain property, not counted
assert.equal(years.at(-1), 1970); // at() accepts negative indices

// --- length and empty slots ----------------------------------------------------
const fruits = ["banana", "apple", "peach"];
fruits[5] = "mango";
assert.equal(fruits.length, 6);
assert.deepEqual(Object.keys(fruits), ["0", "1", "2", "5"]); // 3 and 4 are EMPTY, not undefined
assert.equal(3 in fruits, false);
fruits.length = 10; // growing adds empty slots
assert.equal(fruits[8], undefined);
fruits.length = 2; // shrinking deletes elements
assert.deepEqual(fruits, ["banana", "apple"]);

// Old methods skip empty slots; newer ones treat them as undefined.
const colors = ["red", "yellow", "blue"];
colors[5] = "purple";
const visited = [];
colors.forEach((_, i) => visited.push(i));
assert.deepEqual(visited, [0, 1, 2, 5]);
assert.deepEqual([...colors.keys()], [0, 1, 2, 3, 4, 5]);
assert.deepEqual(colors.toReversed(), ["purple", undefined, undefined, "blue", "yellow", "red"]);

// --- Mutating methods and their copying twins ----------------------------------
const base = [3, 1, 2];
assert.deepEqual(base.toSorted(), [1, 2, 3]);
assert.deepEqual(base, [3, 1, 2]); // untouched
assert.deepEqual(base.toReversed(), [2, 1, 3]);
assert.deepEqual(base.with(0, 9), [9, 1, 2]);
assert.deepEqual(base.toSpliced(1, 1), [3, 2]);
assert.deepEqual(base.slice(0, -1), [3, 1]); // pop without mutating
assert.deepEqual(base.concat([4, 5]), [3, 1, 2, 4, 5]); // push without mutating

// Mutating methods return different things: check before you chain.
const m = [1, 2];
assert.equal(m.push(3), 3); // new length
assert.equal(m.unshift(0), 4); // new length
assert.equal(m.pop(), 3); // removed element
assert.equal(m.shift(), 0); // removed element
assert.equal(m.reverse(), m); // same array
assert.equal(m.sort(), m); // same array

// splice: remove and/or insert in place, returns what was removed.
const list = ["Apple", "Banana", "Strawberry", "Mango", "Cherry"];
assert.deepEqual(list.splice(-3), ["Strawberry", "Mango", "Cherry"]); // remove last 3
assert.deepEqual(list, ["Apple", "Banana"]);
const list2 = ["Apple", "Banana", "Strawberry"];
assert.deepEqual(list2.splice(-2, 2, "Mango", "Cherry"), ["Banana", "Strawberry"]);
assert.deepEqual(list2, ["Apple", "Mango", "Cherry"]);
const list3 = ["Strawberry", "Banana", "Mango"];
list3.splice(list3.indexOf("Banana"), 1); // remove one item by value
assert.deepEqual(list3, ["Strawberry", "Mango"]);

// --- Copies are shallow --------------------------------------------------------
const nested = ["noodles", { list: ["eggs", "flour", "water"] }];
const copy = [...nested];
copy[0] = "rice noodles"; // top level: independent
copy[1].list = ["rice flour", "water"]; // nested: shared
assert.equal(nested[0], "noodles");
assert.deepEqual(nested[1].list, ["rice flour", "water"]);
const alias = nested; // assignment isn't a copy at all
assert.equal(alias, nested);

// --- Iterative methods ---------------------------------------------------------
const nums = [5, 6, 13, 0, 1, 18, 23];
assert.equal(
  nums.reduce((a, b) => a + b),
  66,
);
assert.deepEqual(
  nums.filter((v) => v % 2 === 0),
  [6, 0, 18],
);
assert.deepEqual(
  nums.map((v) => v * 2),
  [10, 12, 26, 0, 2, 36, 46],
);
assert.equal(
  nums.find((v) => v > 10),
  13,
);
assert.equal(
  nums.findIndex((v) => v > 100),
  -1,
);
assert.equal(
  nums.findLast((v) => v > 10),
  23,
);
assert.equal(
  nums.some((v) => v > 20),
  true,
);
assert.equal(
  nums.every((v) => v >= 0),
  true,
);
assert.deepEqual(
  [[1], [2, [3]]].flat(),
  [1, 2, [3]],
);
assert.deepEqual(
  ["a b", "c"].flatMap((s) => s.split(" ")),
  ["a", "b", "c"],
);

// every/some/find stop early.
let calls = 0;
nums.some((v) => {
  calls++;
  return v > 10;
});
assert.equal(calls, 3); // 5, 6, 13 → stopped

// reduce with no initial value on an empty array throws.
assert.throws(() => [].reduce((a, b) => a + b), TypeError);
assert.equal(
  [].reduce((a, b) => a + b, 0),
  0,
);

// Length is fixed when iteration starts: pushes during forEach aren't visited.
const grow = ["e1", "e2"];
const seen = [];
grow.forEach((x, i, arr) => {
  seen.push(x);
  arr.push("new");
});
assert.deepEqual(seen, ["e1", "e2"]);
assert.equal(grow.length, 4);

// Deleting the current element skips the next one.
const shrink = ["e1", "e2", "e3", "e4"];
const visitedShrink = [];
shrink.forEach((x, i, arr) => {
  visitedShrink.push(x);
  arr.splice(i, 1);
});
assert.deepEqual(visitedShrink, ["e1", "e3"]);
assert.deepEqual(shrink, ["e2", "e4"]);

// Generic methods work on array-likes.
assert.equal(Array.prototype.join.call({ 0: "a", 1: "b", length: 2 }, "+"), "a+b");
assert.deepEqual(Array.from({ length: 3 }, (_, i) => i * i), [0, 1, 4]);
assert.equal(Array.isArray({ length: 0 }), false);

// --- sort ------------------------------------------------------------------------
assert.deepEqual([1, 30, 4, 21, 100000].sort(), [1, 100000, 21, 30, 4]); // compared as strings!
assert.deepEqual(
  [40, 1, 5, 200].sort((a, b) => a - b),
  [1, 5, 40, 200],
);
assert.deepEqual(
  [40, 1, 5, 200].sort((a, b) => b - a),
  [200, 40, 5, 1],
);
assert.deepEqual(["80", "9", "700"].sort(), ["700", "80", "9"]);
assert.deepEqual(
  ["80", "9", "700", 40, 1, 5, 200].sort((a, b) => a - b),
  [1, 5, "9", 40, "80", 200, "700"],
);

// undefined and empty slots go to the end.
assert.deepEqual([, undefined, "a", "b"].sort().slice(0, 3), ["a", "b", undefined]);
assert.equal([, undefined, "a", "b"].sort().length, 4);

// Stable since ES2019: equal keys keep their original order.
const students = [
  { name: "Alex", grade: 15 },
  { name: "Devlin", grade: 15 },
  { name: "Eagle", grade: 13 },
  { name: "Sam", grade: 14 },
];
assert.deepEqual(
  students.toSorted((x, y) => x.grade - y.grade).map((s) => s.name),
  ["Eagle", "Sam", "Alex", "Devlin"],
);

// Sorting objects by a string field, and accented text with localeCompare.
const items = [{ name: "Edward" }, { name: "and" }, { name: "Zeros" }];
assert.deepEqual(
  items
    .toSorted((a, b) => {
      const A = a.name.toUpperCase();
      const B = b.name.toUpperCase();
      return A < B ? -1 : A > B ? 1 : 0;
    })
    .map((i) => i.name),
  ["and", "Edward", "Zeros"],
);
assert.deepEqual(
  ["réservé", "premier", "communiqué", "café", "adieu", "éclair"].sort((a, b) => a.localeCompare(b)),
  ["adieu", "café", "communiqué", "éclair", "premier", "réservé"],
);

// A broken comparator (never returns negative) gives engine-dependent results.
// V8 (Node) leaves this one unsorted; Firefox's engine would sort it.
assert.deepEqual(
  [3, 1, 4, 1, 5, 9].sort((a, b) => (a > b ? 1 : 0)),
  [3, 1, 4, 1, 5, 9],
);

// sort returns the SAME array.
const original = [3, 1, 4];
const sorted = original.sort((a, b) => a - b);
sorted[0] = 10;
assert.equal(original[0], 10);

// --- Object.groupBy / Map.groupBy -----------------------------------------------
const inventory = [
  { name: "asparagus", type: "vegetables", quantity: 5 },
  { name: "bananas", type: "fruit", quantity: 0 },
  { name: "goat", type: "meat", quantity: 23 },
  { name: "cherries", type: "fruit", quantity: 5 },
  { name: "fish", type: "meat", quantity: 22 },
];
const byType = Object.groupBy(inventory, ({ type }) => type);
assert.deepEqual(
  byType.fruit.map((i) => i.name),
  ["bananas", "cherries"],
);
assert.equal(Object.getPrototypeOf(byType), null); // null-prototype object
assert.equal(byType.fruit[0], inventory[1]); // same objects, not copies

const restock = Map.groupBy(inventory, ({ quantity }) => (quantity > 5 ? "ok" : "restock"));
assert.deepEqual(
  restock.get("restock").map((i) => i.name),
  ["asparagus", "bananas", "cherries"],
);

// --- Extra checks for claims on the topic page -----------------------------------
// new Array(3) has empty slots, which map skips.
const holes = new Array(3).map(() => 1);
assert.equal(holes.length, 3);
assert.equal(0 in holes, false);
assert.deepEqual(Array.from({ length: 3 }, () => 1), [1, 1, 1]);

// Q7: one comparator, primary key then secondary key.
const bookings = [
  { startMs: 2, name: "Zoe" },
  { startMs: 1, name: "Bea" },
  { startMs: 2, name: "Ada" },
];
assert.deepEqual(
  bookings.toSorted((a, b) => a.startMs - b.startMs || a.name.localeCompare(b.name)).map((b) => b.name),
  ["Bea", "Ada", "Zoe"],
);

// Q8: groupBy's result has no inherited methods.
assert.equal(byType.hasOwnProperty, undefined);
assert.equal(Object.hasOwn(byType, "meat"), true);

// push returns the new length, so chaining on it fails.
assert.throws(() => [1].push(2).map((x) => x), TypeError);

console.log("07-arrays: all checks passed");
