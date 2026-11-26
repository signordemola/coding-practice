// Topic 02: everyday types — primitives, arrays, unions, literals, `as const`, assertions, `!`.
import assert from "node:assert/strict";

// --- 1. Primitives are lowercase; String/Number/Boolean are wrapper objects --
const ok: string = "a";
// @ts-expect-error TS2322 — the String wrapper object isn't a primitive string
const bad: string = new String("a");
assert.equal(typeof ok, "string");
assert.equal(typeof bad, "object");

// --- 2. Arrays and tuples ----------------------------------------------------
const nums: number[] = [1, 2, 3]; // same as Array<number>
const pair: [string, number] = ["deposit", 2500]; // tuple: fixed positions
assert.equal(nums.length + pair.length, 5);

// --- 3. Unions: only what's valid for EVERY member is allowed ----------------
function printId(id: number | string): string {
  // @ts-expect-error TS2339 — toUpperCase doesn't exist on number
  id.toUpperCase;
  if (typeof id === "string") return id.toUpperCase(); // narrowed to string
  return id.toFixed(0); // narrowed to number
}
assert.equal(printId("ab1"), "AB1");
assert.equal(printId(7), "7");

function firstTwo(x: number[] | string): number[] | string {
  return x.slice(0, 2); // slice exists on both members, so it's allowed
}
assert.deepEqual(firstTwo([1, 2, 3]), [1, 2]);

// --- 4. Literal types ----------------------------------------------------------
let changing = "Hello"; // string
const constant = "Hello"; // literal type "Hello"
changing = "Ola";
assert.equal(changing + constant, "OlaHello");

type Alignment = "left" | "right" | "center";
function align(a: Alignment): Alignment {
  return a;
}
// @ts-expect-error TS2345 — "centre" isn't one of the allowed literals
align("centre");

// Object properties widen: req.method is `string`, not "GET".
declare function handleRequest(url: string, method: "GET" | "POST"): void;
const req = { url: "https://example.com", method: "GET" };
// @ts-expect-error TS2345 — string isn't assignable to "GET" | "POST"
const call1 = () => handleRequest(req.url, req.method);
// Fix 1: `as const` makes every property a readonly literal.
const req2 = { url: "https://example.com", method: "GET" } as const;
const call2 = () => handleRequest(req2.url, req2.method);
// @ts-expect-error TS2540 — as const also makes properties readonly
req2.method = "POST";
assert.equal(typeof call1 + typeof call2, "functionfunction"); // not called: handleRequest is only declared

// --- 5. Type assertions: compile-time only, no check at runtime ------------------
const input = JSON.parse('{"id": 1}') as { id: string }; // a lie TS can't see
assert.equal(typeof input.id, "number");
// @ts-expect-error TS2352 — "too different": string to number isn't allowed directly
const x = "hello" as number;
assert.equal(typeof x, "string");

// --- 6. Non-null assertion `!`: removes null/undefined from the type, nothing at runtime
function liveLength(s: string | null): number {
  return s!.length; // you promise s isn't null
}
assert.equal(liveLength("abc"), 3);
assert.throws(() => liveLength(null), TypeError); // the promise was false → runtime crash

// --- 7. symbol and bigint --------------------------------------------------------
const first = Symbol("name");
const second = Symbol("name");
// @ts-expect-error TS2367 — two unique symbols never overlap
const same = first === second;
assert.equal(same, false);
assert.equal(typeof 100n, "bigint");

console.log("02 everyday types: all checks passed");
