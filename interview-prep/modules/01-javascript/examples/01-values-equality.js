// Topic 01: values, types, coercion and equality.
// Run: node interview-prep/modules/01-javascript/examples/01-values-equality.js
// Every line is checked with assert, so the file stops loudly if a claim is wrong.
import assert from "node:assert/strict";

// typeof null is the classic surprise: test for null with === null.
assert.equal(typeof null, "object");
assert.equal(typeof undefined, "undefined");
assert.equal(typeof 10n, "bigint");
assert.equal(typeof Symbol("id"), "symbol");
assert.equal(typeof function () {}, "function"); // functions are callable objects

// Weak typing: + with a string concatenates, other maths operators convert to number.
assert.equal(42 + "1", "421");
assert.equal("6" * "2", 12);
assert.equal(+"", 0); // unary plus always converts to a number
assert.ok(Number.isNaN(+"12px")); // not a whole number string → NaN

// Object to primitive: arrays become strings, so [] + {} is string concatenation.
assert.equal([] + {}, "[object Object]");
assert.equal([1, 2] + [3], "1,23");

// Numbers are IEEE 754 doubles.
assert.equal(0.1 + 0.2 === 0.3, false);
assert.equal(Number.MAX_SAFE_INTEGER, 2 ** 53 - 1);
assert.equal(2 ** 53 === 2 ** 53 + 1, true); // past the safe range, integers collide
assert.equal(42 / -0, -Infinity);

// BigInt can't be mixed with Number in arithmetic.
assert.throws(() => 1n + 1, TypeError);
assert.equal(1n == 1, true);
assert.equal(1n === 1, false);

// Strings are immutable and length counts UTF-16 code units.
const s = "hi";
// Modules are strict, so writing to a string index throws (sloppy code ignores it silently).
assert.throws(() => {
  s[0] = "H";
}, TypeError);
assert.equal(s.toUpperCase(), "HI"); // string methods return new strings
assert.equal(s, "hi");
assert.equal("😀".length, 2); // one emoji, two code units

// Equality: ===, ==, Object.is, SameValueZero.
assert.equal(NaN === NaN, false);
assert.equal(Object.is(NaN, NaN), true);
assert.equal(+0 === -0, true);
assert.equal(Object.is(+0, -0), false);
assert.equal([NaN].indexOf(NaN), -1); // indexOf uses ===
assert.equal([NaN].includes(NaN), true); // includes uses SameValueZero
assert.equal(new Set([NaN, NaN]).size, 1); // Set uses SameValueZero

// Loose equality table highlights (from MDN's table).
assert.equal(0 == false, true);
assert.equal("" == 0, true);
assert.equal([1, 2] == "1,2", true);
assert.equal(null == undefined, true);
assert.equal(null == false, false);
assert.equal(null == 0, false);

// No built-in deep equality: two objects with the same contents are different values.
assert.equal({ a: 1 } === { a: 1 }, false);
const ref = { a: 1 };
assert.equal(ref === ref, true);

console.log("01-values-equality: all checks passed");
