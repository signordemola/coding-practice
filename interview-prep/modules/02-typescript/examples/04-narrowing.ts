// Topic 04: narrowing, discriminated unions, `never` exhaustiveness.
import assert from "node:assert/strict";

// --- 1. typeof: remember typeof null === "object" -----------------------------
function printAll(strs: string | string[] | null): string[] {
  const out: string[] = [];
  if (typeof strs === "object") {
    // strs is string[] | null here
    // @ts-expect-error TS18047 — 'strs' is possibly 'null'
    for (const s of strs) out.push(s);
  }
  return out;
}
assert.throws(() => printAll(null), TypeError);

function printAllFixed(strs: string | string[] | null): string[] {
  if (strs && typeof strs === "object") return [...strs]; // truthiness removes null
  if (typeof strs === "string") return [strs];
  return [];
}
assert.deepEqual(printAllFixed(null), []);
// Trap: wrapping everything in `if (strs)` would also skip the empty string "".
assert.deepEqual(printAllFixed(""), [""]);

// --- 2. Equality narrowing -----------------------------------------------------
function example(x: string | number, y: string | boolean): string {
  if (x === y) return x.toUpperCase() + y.toLowerCase(); // both must be string here
  return "different";
}
assert.equal(example("a", "a"), "Aa");
function clean(v: number | null | undefined): number {
  return v != null ? v : 0; // `!= null` removes BOTH null and undefined
}
assert.equal(clean(undefined) + clean(null) + clean(4), 4);

// --- 3. `in` and instanceof -------------------------------------------------------
type Fish = { swim: () => string };
type Bird = { fly: () => string };
function move(animal: Fish | Bird): string {
  if ("swim" in animal) return animal.swim();
  return animal.fly();
}
assert.equal(move({ fly: () => "flying" }), "flying");

function logValue(x: Date | string): string {
  return x instanceof Date ? x.toISOString().slice(0, 10) : x.toUpperCase();
}
assert.equal(logValue(new Date(Date.UTC(2026, 10, 26))), "2026-11-26");

// --- 4. Assignment narrows, but the DECLARED type limits what you can assign ---------
let v = Math.random() < 2 ? "hello" : 1; // declared (inferred) as string | number
v = 1; // narrowed to number now
assert.equal(v.toFixed(1), "1.0");
// @ts-expect-error TS2322 — boolean isn't part of the declared type
v = true;

// --- 5. Type predicates (user-defined type guards) -----------------------------------
function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}
const zoo: (Fish | Bird)[] = [{ swim: () => "s" }, { fly: () => "f" }];
const fishes: Fish[] = zoo.filter(isFish); // predicate narrows the array type
assert.equal(fishes.length, 1);
// A predicate is a promise TS doesn't check: a wrong body still compiles.
function badIsString(x: unknown): x is string {
  return true;
}
const lied = 5 as unknown;
assert.equal(badIsString(lied) && typeof lied, "number");

// --- 6. Assertion functions: throw or narrow --------------------------------------------
function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) throw new Error("Expected value to be defined");
}
const maybe: string | undefined = ["x"][0];
assertIsDefined(maybe);
assert.equal(maybe.length, 1); // narrowed to string after the call

// --- 7. Discriminated unions + never exhaustiveness --------------------------------------
// Optional-property version: kind doesn't tell TS which fields exist.
interface LooseShape {
  kind: "circle" | "square";
  radius?: number;
  sideLength?: number;
}
function looseArea(s: LooseShape): number {
  // @ts-expect-error TS18048 — radius is possibly undefined even when kind is "circle"
  if (s.kind === "circle") return Math.PI * s.radius ** 2;
  return 0;
}
assert.ok(Number.isNaN(looseArea({ kind: "circle" })));

interface Circle {
  kind: "circle";
  radius: number;
}
interface Square {
  kind: "square";
  sideLength: number;
}
type Shape = Circle | Square;
function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2; // narrowed to Circle
    case "square":
      return shape.sideLength ** 2; // narrowed to Square
    default: {
      const exhaustive: never = shape; // nothing left: shape is never
      return exhaustive;
    }
  }
}
assert.equal(getArea({ kind: "square", sideLength: 3 }), 9);

// Add a member and forget a case: the never check fails to compile.
interface Triangle {
  kind: "triangle";
  sideLength: number;
}
function getArea2(shape: Circle | Square | Triangle): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.sideLength ** 2;
    default: {
      // @ts-expect-error TS2322 — Triangle isn't assignable to never
      const exhaustive: never = shape;
      return exhaustive;
    }
  }
}
assert.equal(typeof getArea2, "function");

console.log("04 narrowing: all checks passed");
