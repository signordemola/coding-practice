// Topic 06: object types — optional, readonly, index signatures, excess property checks, tuples.
import assert from "node:assert/strict";

// --- 1. Optional properties and defaults in destructuring ----------------------
interface PaintOptions {
  shape: string;
  xPos?: number;
  yPos?: number;
}
function paintShape({ shape, xPos = 0, yPos = 0 }: PaintOptions): string {
  return `${shape}@${xPos},${yPos}`; // xPos is number (default removes undefined)
}
assert.equal(paintShape({ shape: "circle", yPos: 5 }), "circle@0,5");
// Trap: `{ shape: Shape }` inside a destructuring pattern RENAMES, it doesn't annotate.
function draw({ shape: Shape }: PaintOptions) {
  return Shape; // the variable is called Shape
}
assert.equal(draw({ shape: "sq" }), "sq");

// --- 2. readonly is shallow and compile-time only ---------------------------------
interface Home {
  readonly resident: { name: string; age: number };
}
function visitForBirthday(home: Home) {
  home.resident.age++; // allowed: readonly isn't deep
}
function evict(home: Home) {
  // @ts-expect-error TS2540 — can't reassign the readonly property itself
  home.resident = { name: "Victor", age: 42 };
}
const home: Home = { resident: { name: "Ada", age: 41 } };
visitForBirthday(home);
assert.equal(home.resident.age, 42);
evict(home);
assert.equal(home.resident.name, "Victor"); // nothing stops it at runtime

// readonly doesn't block assignment between types → aliasing.
interface Person {
  name: string;
  age: number;
}
interface ReadonlyPerson {
  readonly name: string;
  readonly age: number;
}
const writablePerson: Person = { name: "Person McPersonface", age: 42 };
const readonlyPerson: ReadonlyPerson = writablePerson; // allowed
writablePerson.age++;
assert.equal(readonlyPerson.age, 43); // changed through the other reference

// --- 3. Index signatures -------------------------------------------------------------
interface NumberDictionary {
  [index: string]: number;
  length: number; // OK, a number
  // @ts-expect-error TS2411 — every named property must match the string index type
  name: string;
}
interface NumberOrStringDictionary {
  [index: string]: number | string;
  length: number;
  name: string; // fine with a union index type
}
const dict: NumberOrStringDictionary = { length: 1, name: "x", extra: 3 };
assert.equal(dict["extra"], 3);
const nd = {} as NumberDictionary;
assert.equal(typeof nd, "object");

// Number keys are converted to strings: obj[0] is obj["0"].
const o: Record<string, string> = { "0": "zero" };
assert.equal(o[0], "zero");

// --- 4. Excess property checks: only on fresh object LITERALS ---------------------------
interface SquareConfig {
  color?: string;
  width?: number;
}
function createSquare(config: SquareConfig): { color: string; area: number } {
  return { color: config.color ?? "red", area: (config.width ?? 20) ** 2 };
}
// @ts-expect-error TS2561 — 'colour' doesn't exist; did you mean 'color'?
createSquare({ colour: "red", width: 100 });
// Escape hatch 1: assign to a variable first (no "freshness"), with at least one shared property.
const squareOptions = { colour: "red", width: 100 };
assert.equal(createSquare(squareOptions).color, "red"); // the typo is silently ignored
// But a "weak type" (all optional) still needs SOME overlap:
const nothingShared = { colour: "red" };
// @ts-expect-error TS2559 — no properties in common with SquareConfig
createSquare(nothingShared);
// Escape hatch 2: an assertion.
assert.equal(createSquare({ width: 100, opacity: 0.5 } as SquareConfig).area, 10000);

// --- 5. Arrays and readonly arrays -----------------------------------------------------
const roArray: ReadonlyArray<string> = ["red", "green", "blue"];
// @ts-expect-error TS2339 — no push on a readonly array
roArray.push("hello!");
let mutable: string[] = ["a"];
const ro: readonly string[] = mutable; // mutable → readonly is fine
// @ts-expect-error TS4104 — readonly → mutable is not
mutable = ro;
// readonly is compile-time only: the push above still ran, so roArray now has 4 items.
assert.equal(roArray.length, 4);
assert.equal(mutable, ro); // same array object

// --- 6. Tuples ---------------------------------------------------------------------------
type StringNumberPair = [string, number];
function doSomething(pair: StringNumberPair): string {
  const [label, amount] = pair;
  // @ts-expect-error TS2493 — index 2 is out of range for a 2-tuple
  pair[2];
  return `${label}:${amount}`;
}
assert.equal(doSomething(["deposit", 2500]), "deposit:2500");

type Either2dOr3d = [number, number, number?];
const p: Either2dOr3d = [1, 2];
const len: 2 | 3 = p.length; // optional element → length is a union
assert.equal(len, 2);

type StringNumberBooleans = [string, number, ...boolean[]];
const t: StringNumberBooleans = ["a", 1, true, false, true];
assert.equal(t.length, 5);

// `as const` array → readonly tuple, which can't go where a mutable tuple is expected.
const point = [3, 4] as const;
function distanceFromOrigin([x, y]: [number, number]) {
  return Math.sqrt(x ** 2 + y ** 2);
}
// @ts-expect-error TS4104 — readonly [3, 4] can't go where a mutable [number, number] is expected
distanceFromOrigin(point);
assert.equal(distanceFromOrigin([3, 4]), 5);

console.log("06 object types: all checks passed");
