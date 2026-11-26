// Topic 05: function types, generics, constraints, overloads, callbacks, void.
import assert from "node:assert/strict";

// --- 1. Function type expressions: parameter NAMES are required ----------------
type GreetFunction = (a: string) => void;
const greeter = (fn: GreetFunction) => fn("Hello, World");
let heard = "";
greeter((s) => (heard = s)); // s inferred as string (contextual typing)
assert.equal(heard, "Hello, World");
// Trap: `(string) => void` means a parameter NAMED "string" of type any.

// --- 2. Call signatures: a function with properties --------------------------------
type DescribableFunction = {
  description: string;
  (someArg: number): boolean;
};
function myFunc(someArg: number) {
  return someArg > 3;
}
myFunc.description = "default description"; // TS allows adding properties to a function declaration
const describe = (fn: DescribableFunction) => `${fn.description} returned ${fn(6)}`;
assert.equal(describe(myFunc), "default description returned true");

// Construct signature: something you call with `new`.
type Ctor<T> = new (...args: never[]) => T;
const make = <T>(c: Ctor<T>) => new c();
assert.ok(make(Map) instanceof Map);

// --- 3. Generics relate input and output -------------------------------------------
function firstElement<Type>(arr: Type[]): Type | undefined {
  return arr[0];
}
const s = firstElement(["a", "b"]); // string | undefined
const n = firstElement([1, 2]); // number | undefined
assert.equal(`${s}${n}`, "a1");

function map<Input, Output>(arr: Input[], func: (arg: Input) => Output): Output[] {
  return arr.map(func);
}
const parsed = map(["1", "2", "3"], (x) => parseInt(x)); // Input = string, Output = number
assert.deepEqual(parsed, [1, 2, 3]);

// --- 4. Constraints -----------------------------------------------------------------
function longest<Type extends { length: number }>(a: Type, b: Type): Type {
  return a.length >= b.length ? a : b;
}
assert.deepEqual(longest([1, 2], [1, 2, 3]), [1, 2, 3]);
assert.equal(longest("alice", "bob"), "alice"); // Type = "alice" | "bob"
// @ts-expect-error TS2345 — numbers have no length
longest(10, 100);

// Classic mistake: returning "something that matches the constraint", not the SAME type.
function minimumLength<Type extends { length: number }>(obj: Type, minimum: number): Type {
  if (obj.length >= minimum) return obj;
  // @ts-expect-error TS2322 — { length } isn't necessarily the caller's Type
  return { length: minimum };
}
const arr = minimumLength([1, 2, 3], 6); // TS thinks it's number[]...
assert.equal(Array.isArray(arr), false); // ...but at runtime it's a plain object
assert.throws(() => arr.slice(0), TypeError);

// Specifying type arguments when inference picks too narrow a type.
function combine<Type>(arr1: Type[], arr2: Type[]): Type[] {
  return arr1.concat(arr2);
}
// @ts-expect-error TS2322 — inferred Type = number, so "hello" is rejected
combine([1, 2, 3], ["hello"]);
assert.deepEqual(combine<string | number>([1, 2, 3], ["hello"]), [1, 2, 3, "hello"]);

// Guideline: push type parameters down.
function firstElement1<Type>(arr: Type[]) {
  return arr[0];
}
function firstElement2<Type extends unknown[]>(arr: Type) {
  return arr[0];
}
const a1 = firstElement1([1, 2, 3]); // number | undefined — good
const a2 = firstElement2([1, 2, 3]); // resolved through the constraint — less precise
assert.equal(a1, a2);

// Type parameters constrained by another: keyof.
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const x = { a: 1, b: 2, c: 3, d: 4 };
assert.equal(getProperty(x, "a"), 1);
// @ts-expect-error TS2345 — "m" isn't a key of x
getProperty(x, "m");

// --- 5. Optional parameters and callbacks ------------------------------------------
function f(x?: number) {
  return x ?? 10; // x is number | undefined
}
assert.equal(f() + f(undefined) + f(1), 21);

// Rule: never make a callback parameter optional unless YOU call it without that argument.
function myForEach(items: unknown[], callback: (arg: unknown, index?: number) => void) {
  for (let i = 0; i < items.length; i++) callback(items[i]); // allowed to omit index!
}
assert.throws(
  () =>
    myForEach([1], (_a, i) => {
      // @ts-expect-error TS18048 — the optional index forces a check real callers don't want
      i.toFixed();
    }),
  TypeError, // and myForEach really did call it without an index
);

// Fewer parameters are fine: a callback may ignore extra arguments.
const lengths = ["ab", "c"].map((s) => s.length);
assert.deepEqual(lengths, [2, 1]);

// --- 6. Overloads: prefer a union parameter ---------------------------------------------
function makeDate(timestamp: number): Date;
function makeDate(m: number, d: number, y: number): Date;
function makeDate(mOrTimestamp: number, d?: number, y?: number): Date {
  if (d !== undefined && y !== undefined) return new Date(y, mOrTimestamp, d);
  return new Date(mOrTimestamp);
}
assert.equal(makeDate(0).getTime(), 0);
assert.equal(makeDate(10, 26, 2026).getDate(), 26);
// @ts-expect-error TS2575 — the implementation signature isn't callable from outside
makeDate(1, 3);

function len(s: string): number;
function len(arr: unknown[]): number;
function len(x: string | unknown[]) {
  return x.length;
}
const strOrArr: string | number[] = Math.random() < 2 ? "hello" : [0];
// @ts-expect-error TS2769 — a call resolves to ONE overload; a union fits neither
len(strOrArr);
function lenUnion(x: unknown[] | string) {
  return x.length; // the union version just works
}
assert.equal(lenUnion(strOrArr), 5);

// --- 7. void: a contextual () => void implementation may return a value -----------------
const src = [1, 2, 3];
const dst = [0];
src.forEach((el) => dst.push(el)); // push returns a number; ignored
assert.deepEqual(dst, [0, 1, 2, 3]);
type VoidFunc = () => void;
const f1: VoidFunc = () => true;
assert.equal(f1(), true); // the value still exists at runtime; its TYPE is void
function noReturn(): void {
  // @ts-expect-error TS2322 — a function DECLARED to return void can't return a value
  return true;
}
assert.equal(noReturn(), true);

// --- 8. Rest arguments and `as const` tuples -------------------------------------------------
const args = [8, 5]; // number[] — could be any length
// @ts-expect-error TS2556 — spread of number[] into a 2-parameter function
Math.atan2(...args);
const args2 = [8, 5] as const; // readonly [8, 5]
assert.equal(Math.atan2(...args2), Math.atan2(8, 5));

console.log("05 functions/generics: all checks passed");
