// Topic 11: structural typing and type compatibility.
import assert from "node:assert/strict";

// --- 1. Structural, not nominal ---------------------------------------------------
interface Pet {
  name: string;
}
class Dog {
  name: string;
  breed: string;
  constructor(name: string, breed: string) {
    this.name = name;
    this.breed = breed;
  }
}
const pet: Pet = new Dog("Rex", "collie"); // Dog never says "implements Pet" — the shape is enough
assert.equal(pet.name, "Rex");
const dogLike = { name: "Lassie", owner: "Sam" };
const pet2: Pet = dogLike; // extra properties are fine through a variable...
// @ts-expect-error TS2353 — ...but a fresh object literal gets the excess property check
const pet3: Pet = { name: "Lassie", owner: "Sam" };
assert.equal(pet2.name + pet3.name, "LassieLassie");

// Branded types: a common pattern (not a built-in) to get nominal-like safety.
type BookingId = string & { readonly __brand: "BookingId" };
type ClientId = string & { readonly __brand: "ClientId" };
const toBookingId = (s: string) => s as BookingId;
function cancel(id: BookingId) {
  return `cancelled ${id}`;
}
assert.equal(cancel(toBookingId("b_1")), "cancelled b_1");
// @ts-expect-error TS2345 — a plain string (or a ClientId) isn't a BookingId
cancel("c_1" as ClientId);

// --- 2. Functions: fewer parameters are assignable to more ---------------------------
let x = (a: number) => 0;
let y = (b: number, s: string) => 0;
y = x; // OK: x ignores the extra argument
// @ts-expect-error TS2322 — y needs a second argument x's callers won't pass
x = y;
assert.equal(x(1) + y(1, "s"), 0);

// Return types: the source must return at least what the target promises.
let rx = () => ({ name: "Alice" });
let ry = () => ({ name: "Alice", location: "Seattle" });
rx = ry;
// @ts-expect-error TS2322 — rx's result lacks location
ry = rx;
assert.equal(rx().name + ry().name, "AliceAlice");

// --- 3. strictFunctionTypes: function SYNTAX is checked contravariantly; METHOD syntax isn't ---
type Animal = { name: string };
type Cat = Animal & { meow(): string };
type FnHandler = (a: Animal) => void;
interface MethodHandler {
  handle(a: Animal): void;
}
const catOnly = (c: Cat) => c.meow();
// @ts-expect-error TS2322 — function-type property: a Cat-only handler can't take any Animal
const h1: FnHandler = catOnly;
const h2: MethodHandler = { handle: catOnly }; // method syntax: bivariant, allowed (unsound)
assert.throws(() => h2.handle({ name: "generic animal" }), TypeError); // the unsoundness, live
assert.equal(typeof h1, "function");

// --- 4. Classes: only instance members count; private/protected act nominally -------------
class Animal1 {
  feet: number;
  constructor(_name: string, numFeet: number) {
    this.feet = numFeet;
  }
}
class Size {
  feet: number;
  constructor(numFeet: number) {
    this.feet = numFeet;
  }
}
let a: Animal1 = new Animal1("x", 4);
const s: Size = a; // constructors and statics are ignored
a = s;
assert.equal(s.feet, 4);

class WithPrivate {
  private secret = 1;
}
class AlsoPrivate {
  private secret = 1;
}
// @ts-expect-error TS2322 — private members must come from the same declaration
const wp: WithPrivate = new AlsoPrivate();
assert.equal(typeof wp, "object");

// --- 5. Generics: only matter where the type parameter is used -------------------------------
interface Empty<T> {}
let e1: Empty<number> = {};
const e2: Empty<string> = e1; // OK: T isn't used, so the types are identical
interface NotEmpty<T> {
  data: T;
}
const ne1: NotEmpty<number> = { data: 1 };
// @ts-expect-error TS2322 — now T matters
const ne2: NotEmpty<string> = ne1;
assert.equal(typeof e2 + typeof ne2, "objectobject");

console.log("11 compatibility: all checks passed");
