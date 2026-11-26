// Topic 08: built-in utility types, with booking-flavoured examples.
import assert from "node:assert/strict";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

interface Booking {
  id: string;
  serviceId: string;
  startsAt: string; // ISO instant
  status: "pending" | "confirmed" | "cancelled";
  depositMinor: number;
  notes?: string;
}

// Partial: every property optional — an update/patch payload.
function updateBooking(b: Booking, fields: Partial<Booking>): Booking {
  return { ...b, ...fields };
}
const b1: Booking = { id: "b1", serviceId: "s1", startsAt: "2026-11-26T09:00:00Z", status: "pending", depositMinor: 2500 };
assert.equal(updateBooking(b1, { status: "confirmed" }).status, "confirmed");

// Required: removes `?`.
// @ts-expect-error TS2322 — notes is optional in b1's type but required in Required<Booking>
const full: Required<Booking> = { ...b1 };

// Readonly: compile-time freeze (models Object.freeze).
const frozen: Readonly<Booking> = Object.freeze({ ...b1 });
assert.throws(() => {
  // @ts-expect-error TS2540 — read-only property
  frozen.status = "cancelled";
}, TypeError); // here the runtime blocks it too, but only because of Object.freeze (strict code throws)

// Record<Keys, Type>: an object with exactly those keys.
type Status = Booking["status"];
const labels: Record<Status, string> = { pending: "Awaiting deposit", confirmed: "Booked", cancelled: "Cancelled" };
// @ts-expect-error TS2741 — every key in the union is required
const partialLabels: Record<Status, string> = { pending: "x", confirmed: "y" };
assert.equal(labels.confirmed, "Booked");

// Pick / Omit: choose or drop properties.
type BookingCard = Pick<Booking, "startsAt" | "status">;
type NewBooking = Omit<Booking, "id" | "status">; // the create-form payload
type _1 = Expect<Equal<BookingCard, { startsAt: string; status: Status }>>;
const create: NewBooking = { serviceId: "s1", startsAt: "2026-12-01T10:00:00Z", depositMinor: 2500 };
assert.equal("id" in create, false);
// Omit doesn't check that the key exists: a typo silently omits nothing.
type Oops = Omit<Booking, "idd">;
type _2 = Expect<Equal<keyof Oops, keyof Booking>>;
// Pick IS limited to real keys:
// @ts-expect-error TS2344 — "idd" doesn't satisfy keyof Booking
type PickTypo = Pick<Booking, "idd">;
// Record keys are exact in a literal: an extra key is an excess property.
// @ts-expect-error TS2353 — 'refunded' isn't a Status
const extraLabel: Record<Status, string> = { pending: "a", confirmed: "b", cancelled: "c", refunded: "d" };

// Exclude / Extract work on UNION members; Omit/Pick on object properties.
type Active = Exclude<Status, "cancelled">;
type _3 = Expect<Equal<Active, "pending" | "confirmed">>;
type _4 = Expect<Equal<Extract<Status | 42, string>, Status>>;
type Shape = { kind: "circle"; radius: number } | { kind: "square"; x: number } | { kind: "triangle"; x: number; y: number };
type _5 = Expect<Equal<Exclude<Shape, { kind: "circle" }>, { kind: "square"; x: number } | { kind: "triangle"; x: number; y: number }>>;
type _6 = Expect<Equal<NonNullable<string | null | undefined>, string>>;

// Function helpers.
function quote(serviceId: string, durationMin: number): { totalMinor: number } {
  return { totalMinor: durationMin * 100 };
}
type _7 = Expect<Equal<Parameters<typeof quote>, [serviceId: string, durationMin: number]>>;
type _8 = Expect<Equal<ReturnType<typeof quote>, { totalMinor: number }>>;
class Slot {
  readonly startsAt: string;
  constructor(startsAt: string) {
    this.startsAt = startsAt;
  }
}
type _9 = Expect<Equal<InstanceType<typeof Slot>, Slot>>;
type _10 = Expect<Equal<ConstructorParameters<typeof Slot>, [startsAt: string]>>;

// Awaited: unwraps promises recursively.
type _11 = Expect<Equal<Awaited<Promise<Promise<number>>>, number>>;
type _12 = Expect<Equal<Awaited<boolean | Promise<number>>, boolean | number>>;
async function loadBooking(): Promise<Booking> {
  return b1;
}
type Loaded = Awaited<ReturnType<typeof loadBooking>>;
type _13 = Expect<Equal<Loaded, Booking>>;

// NoInfer: stop a parameter from widening the inferred type.
function createStreetLight<C extends string>(colors: C[], defaultColor?: NoInfer<C>) {
  return defaultColor ?? colors[0];
}
assert.equal(createStreetLight(["red", "yellow", "green"], "red"), "red");
// @ts-expect-error TS2345 — "blue" isn't one of the colours
createStreetLight(["red", "yellow", "green"], "blue");

assert.equal(typeof full + typeof partialLabels + typeof extraLabel, "objectobjectobject");
console.log("08 utility types: all checks passed");
