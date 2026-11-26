// Topic 01: what TypeScript is, inference, erasure, strict mode.
// Run: node interview-prep/modules/02-typescript/examples/run-all.js (type-check + error codes + run)
// Each `// @ts-expect-error TSxxxx` line below is proven by run-all.js to hide exactly that error.
import assert from "node:assert/strict";

// --- 1. Static checking catches bugs before running --------------------------
const user = { name: "Daniel", age: 26 };
// @ts-expect-error TS2339 — property doesn't exist (plain JS would just give undefined)
assert.equal(user.location, undefined);

const announcement = "Hello World!";
// @ts-expect-error TS2551 — typo: did you mean 'toLocaleLowerCase'?
assert.throws(() => announcement.toLocaleLowercase(), TypeError);

// Uncalled function: comparing the function itself, not its result.
// @ts-expect-error TS2365 — operator '<' can't be applied to '() => number' and 'number'
const coinFlip = Math.random < 0.5;
assert.equal(coinFlip, false);

// --- 2. Inference: you rarely need to annotate locals -----------------------
let msg = "hello there!"; // inferred: string
msg = "still a string";
// @ts-expect-error TS2322 — number isn't assignable to the inferred string
msg = 42;

// --- 3. Erasure: types never change what the code does at runtime -----------
function greet(person: string, date: Date): string {
  return `Hello ${person}, today is ${date.toDateString()}!`;
}
// The type annotations are gone at runtime: Node replaced them with spaces.
assert.equal(greet.length, 2);
assert.match(greet("Maddison", new Date(2026, 10, 26)), /^Hello Maddison, today is Thu Nov 26 2026!$/);
// @ts-expect-error TS2345 — Date() (without new) returns a string, not a Date
assert.throws(() => greet("Maddison", Date()), TypeError);

// A type assertion doesn't convert anything: the value is still a number.
const notReallyAString = 5 as unknown as string;
assert.equal(typeof notReallyAString, "number");

// --- 4. strict family: the settings this repo uses ---------------------------
// noImplicitAny: a parameter with no type and no context is an error.
// @ts-expect-error TS7006 — parameter 's' implicitly has an 'any' type
function shout(s) {
  return String(s).toUpperCase();
}
assert.equal(shout("hi"), "HI");

// strictNullChecks: find() can return undefined, so you must check it.
const users = [{ name: "Ana", age: 30 }];
const found = users.find((u) => u.name === "Ben");
// @ts-expect-error TS18048 — 'found' is possibly 'undefined'
assert.throws(() => found.age, TypeError);
assert.equal(found?.age, undefined); // optional chaining handles it

// useUnknownInCatchVariables: a caught value is `unknown`, because anything can be thrown.
try {
  throw "a string, not an Error";
} catch (err) {
  // @ts-expect-error TS18046 — 'err' is of type 'unknown'
  assert.equal(err.message, undefined);
  const text = err instanceof Error ? err.message : String(err); // narrow first
  assert.equal(text, "a string, not an Error");
}

// noUncheckedIndexedAccess (on in this repo): indexing may give undefined.
const slots = ["09:00", "10:00"];
const third = slots[2]; // type: string | undefined
// @ts-expect-error TS18048 — possibly undefined without a check
assert.throws(() => third.length, TypeError);
assert.equal(third ?? "none", "none");

const env: Record<string, string> = {};
const mode = env["NODE_ENV"]; // string | undefined, not string
assert.equal(mode, undefined);

// exactOptionalPropertyTypes (on in this repo): "missing" and "set to undefined" differ.
interface UserDefaults {
  colorThemeOverride?: "dark" | "light";
}
const prefs: UserDefaults = {};
// @ts-expect-error TS2412 — undefined isn't allowed unless the type says `| undefined`
prefs.colorThemeOverride = undefined;
assert.equal("colorThemeOverride" in prefs, true); // the runtime difference the flag protects
assert.equal("colorThemeOverride" in {}, false);

console.log("01 basics/strict: all checks passed");
