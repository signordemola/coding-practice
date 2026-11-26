// Topic 03: `type` vs `interface`.
import assert from "node:assert/strict";

// --- 1. Both can describe an object shape, interchangeably ---------------------
interface PointI {
  x: number;
  y: number;
}
type PointT = { x: number; y: number };
const a: PointI = { x: 1, y: 2 };
const b: PointT = a; // structural typing: same shape, so compatible
assert.deepEqual(b, { x: 1, y: 2 });

// --- 2. Only `type` can name a union, primitive, tuple or function type ---------
type BookingStatus = "pending" | "confirmed" | "cancelled";
type Id = string; // just another name: any string is accepted
type Range = [start: number, end: number];
type Formatter = (amountMinor: number) => string;
const status: BookingStatus = "pending";
const id: Id = "anything at all";
const range: Range = [9, 17];
const fmt: Formatter = (n) => (n / 100).toFixed(2);
assert.equal(`${status} ${id} ${range[1]} ${fmt(2500)}`, "pending anything at all 17 25.00");

// --- 3. Declaration merging: interfaces re-open, types can't ---------------------
interface Settings {
  theme: string;
}
interface Settings {
  locale: string; // merged into the same interface
}
const s: Settings = { theme: "dark", locale: "en-GB" };
// @ts-expect-error TS2741 — after merging, locale is required too
const missing: Settings = { theme: "dark" };
assert.equal(s.locale + (missing.locale ?? ""), "en-GB");

// @ts-expect-error TS2300 — duplicate identifier: a type alias can't be re-opened
type Window2 = { title: string };
// @ts-expect-error TS2300
type Window2 = { ts: number };

// --- 4. Extending: `extends` vs intersection `&` --------------------------------
interface Animal {
  name: string;
}
interface Bear extends Animal {
  honey: boolean;
}
type BearT = Animal & { honey: boolean };
const bear: Bear = { name: "Paddington", honey: true };
const bearT: BearT = bear;
assert.equal(bearT.honey, true);

// Conflicting property types: `extends` errors at the declaration...
interface Person1 {
  name: string;
}
// @ts-expect-error TS2430 — 'name' types are incompatible
interface Person2 extends Person1 {
  name: number;
}
// ...but an intersection silently becomes `never` for that property.
type Both = Person1 & { name: number };
type NameOfBoth = Both["name"]; // never
const check: NameOfBoth extends never ? true : false = true;
// @ts-expect-error TS2322 — no value can be string AND number
const impossible: Both = { name: "x" };
assert.equal(check && typeof impossible, "object");

// --- 5. An interface can't BE a union, but it can extend a type alias of an object
type Base = { createdAt: string };
interface Booking extends Base {
  status: BookingStatus;
}
const booking: Booking = { createdAt: "2026-11-26", status: "confirmed" };
assert.equal(booking.status, "confirmed");

console.log("03 type vs interface: all checks passed");
