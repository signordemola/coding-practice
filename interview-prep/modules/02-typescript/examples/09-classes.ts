// Topic 09: classes — fields, readonly, implements vs extends, override, visibility, abstract, `this`.
// Constructor parameter properties are NOT here: they aren't erasable (see 12-not-erasable.tsc-only.ts).
import assert from "node:assert/strict";

// --- 1. Fields and strictPropertyInitialization ----------------------------------
class GoodGreeter {
  name: string;
  constructor() {
    this.name = "hello"; // must be set IN the constructor
  }
}
class BadGreeter {
  // @ts-expect-error TS2564 — not definitely assigned in the constructor
  name: string;
}
class OKGreeter {
  name!: string; // definite assignment assertion: "something else sets it"
}
assert.equal(new GoodGreeter().name, "hello");
assert.equal(new BadGreeter().name, undefined);
assert.equal(new OKGreeter().name, undefined); // the `!` is a promise, not a value

// readonly: assignable only in the declaration or constructor.
class Greeter {
  readonly name: string = "world";
  constructor(otherName?: string) {
    if (otherName !== undefined) this.name = otherName;
  }
  err() {
    // @ts-expect-error TS2540 — readonly outside the constructor
    this.name = "not ok";
  }
}
const g = new Greeter();
g.err();
assert.equal(g.name, "not ok"); // compile-time only: it still ran

// --- 2. implements = a CHECK; it adds nothing to the class --------------------------
interface Pingable {
  ping(): void;
}
class Sonar implements Pingable {
  ping() {}
}
// @ts-expect-error TS2420 — Ball doesn't have ping()
class Ball implements Pingable {
  pong() {}
}
interface Checkable {
  check(name: string): boolean;
}
class NameChecker implements Checkable {
  // @ts-expect-error TS7006 — implements doesn't type the parameter for you
  check(s) {
    return s.toLowerCase() === "ok";
  }
}
interface A {
  x: number;
  y?: number;
}
class C implements A {
  x = 0;
}
const c = new C();
// @ts-expect-error TS2339 — an optional interface property isn't created on the class
c.y = 10;
assert.equal(new NameChecker().check("OK") && typeof new Sonar().ping + typeof new Ball().pong, "functionfunction");

// The interview example: depend on an interface, swap in a fake for tests.
interface PaymentProvider {
  charge(amountMinor: number, bookingId: string): Promise<string>;
}
class FakeProvider implements PaymentProvider {
  charges: string[] = [];
  async charge(_amountMinor: number, bookingId: string) {
    this.charges.push(bookingId);
    return `fake_${bookingId}`;
  }
}
async function takeDeposit(provider: PaymentProvider, bookingId: string) {
  return provider.charge(2500, bookingId); // booking code only knows the interface
}
const fake = new FakeProvider();
assert.equal(await takeDeposit(fake, "b1"), "fake_b1");
assert.deepEqual(fake.charges, ["b1"]);

// --- 3. extends = INHERIT code; overrides must stay compatible -------------------------
class Base {
  greet() {
    return "Hello, world!";
  }
}
class Derived extends Base {
  override greet(name?: string) {
    return name === undefined ? super.greet() : `Hello, ${name.toUpperCase()}`;
  }
}
const d = new Derived();
assert.equal(d.greet(), "Hello, world!");
assert.equal(d.greet("reader"), "Hello, READER");
const asBase: Base = d; // a Derived is a Base
assert.equal(asBase.greet(), "Hello, world!");

class BadDerived extends Base {
  // @ts-expect-error TS2416 — a required parameter breaks callers that use the Base type
  override greet(name: string) {
    return `Hello, ${name.toUpperCase()}`;
  }
}
// @ts-expect-error TS2322 — and so TS won't let you use it as a Base either
const broken: Base = new BadDerived();
assert.throws(() => broken.greet(), TypeError); // exactly the crash TS was warning about

// noImplicitOverride (on in this repo): overriding requires the `override` keyword.
class Quiet extends Base {
  // @ts-expect-error TS4114 — must have an 'override' modifier
  greet() {
    return "shh";
  }
}
assert.equal(new Quiet().greet(), "shh");

// Initialisation order (JavaScript): base fields → base constructor → derived fields → derived constructor.
const log: string[] = [];
class BaseName {
  name = "base";
  constructor() {
    log.push(`base ctor sees ${this.name}`);
  }
}
class DerivedName extends BaseName {
  override name = "derived";
}
const dn = new DerivedName();
assert.deepEqual(log, ["base ctor sees base"]);
assert.equal(dn.name, "derived");

// --- 4. Visibility: public / protected / private (TS) vs #private (JS) ------------------------
class Account {
  public owner = "ada";
  protected balanceMinor = 1000;
  private secretKey = "sk_fake";
  #pin = "1234";
  hasPin(p: string) {
    return p === this.#pin;
  }
  sameKey(other: Account) {
    return other.secretKey === this.secretKey; // private is per CLASS, so another instance is fine
  }
}
class Savings extends Account {
  show() {
    return this.balanceMinor; // protected: visible in subclasses
  }
  leak() {
    // @ts-expect-error TS2341 — private: not even subclasses
    return this.secretKey;
  }
}
const acct = new Savings();
// @ts-expect-error TS2445 — protected outside the class hierarchy
acct.balanceMinor;
// @ts-expect-error TS2341 — private outside the class
acct.secretKey;
assert.equal(acct["secretKey"], "sk_fake"); // bracket access is allowed by TS: "soft private"
assert.equal(acct.show() + acct.leak(), "1000sk_fake");
assert.equal(acct.sameKey(new Account()), true);
assert.equal(Object.keys(acct).includes("secretKey"), true); // visible at runtime
assert.equal(Object.keys(acct).includes("#pin"), false); // #private is truly hidden
assert.equal(acct.hasPin("1234"), true);

// A subclass can make a protected member public.
class Base2 {
  protected m = 10;
}
class Derived2 extends Base2 {
  override m = 15; // no modifier → public now
}
assert.equal(new Derived2().m, 15);

// A subclass can't make a private member visible.
class Base3 {
  private x = 1;
}
// @ts-expect-error TS2415 — 'x' is private in Base3 but not in Derived3
class Derived3 extends Base3 {
  override x = 2;
}
assert.equal(new Derived3().x, 2);

// --- 5. abstract classes ---------------------------------------------------------------------
abstract class Notifier {
  abstract send(to: string): string;
  notify(to: string) {
    return `sent: ${this.send(to)}`;
  }
}
// @ts-expect-error TS2511 — can't create an instance of an abstract class
new Notifier();
// @ts-expect-error TS2515 — must implement the abstract member send
class LazyNotifier extends Notifier {}
class SmsNotifier extends Notifier {
  send(to: string) {
    return `SMS to ${to}`;
  }
}
assert.equal(new SmsNotifier().notify("+44..."), "sent: SMS to +44...");
function make(ctor: new () => Notifier) {
  return new ctor();
}
assert.ok(make(SmsNotifier) instanceof Notifier);
// @ts-expect-error TS2345 — an abstract class doesn't fit a `new () => …` signature
make(Notifier);
assert.equal(typeof LazyNotifier, "function");

// --- 6. `this`: lost at runtime; arrow fields and `this` parameters ---------------------------
class MyClass {
  name = "MyClass";
  getName() {
    return this.name;
  }
  getNameArrow = () => this.name; // captured per instance
  getNameChecked(this: MyClass) {
    return this.name; // the `this` parameter is erased at runtime
  }
}
const mc = new MyClass();
const obj = { name: "obj", getName: mc.getName };
assert.equal(obj.getName(), "obj"); // `this` follows the call site
const arrow = mc.getNameArrow;
assert.equal(arrow(), "MyClass");
const checked = mc.getNameChecked;
// @ts-expect-error TS2684 — the 'this' context of type 'void' isn't MyClass
assert.throws(() => checked(), TypeError);
assert.equal(mc.getNameChecked.length, 0); // `this` isn't a real parameter

// `this` as a return type keeps subclass types in chains.
class Box {
  contents = "";
  set(value: string) {
    this.contents = value;
    return this;
  }
}
class ClearableBox extends Box {
  clear() {
    this.contents = "";
  }
}
const cb = new ClearableBox().set("hello"); // type: ClearableBox, not Box
cb.clear();
assert.equal(cb.contents, "");

// --- 7. Classes are compared structurally ------------------------------------------------------
class Point1 {
  x = 0;
  y = 0;
}
class Point2 {
  x = 0;
  y = 0;
}
const p: Point1 = new Point2(); // OK: same shape
assert.equal(p instanceof Point1, false); // ...but instanceof is a runtime prototype check
class Empty {}
function fn(x: Empty) {
  return x;
}
fn(globalThis); // an empty class accepts (almost) anything — avoid
fn({});
fn(fn);

console.log("09 classes: all checks passed");
