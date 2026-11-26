// Topic 04: the prototype chain, constructors and classes.
// Run: node interview-prep/modules/01-javascript/examples/04-prototypes-classes.js
import assert from "node:assert/strict";

// --- Lookup walks the chain; own properties shadow -------------------------
const o = { a: 1, b: 2, __proto__: { b: 3, c: 4 } };
// { a: 1, b: 2 } ---> { b: 3, c: 4 } ---> Object.prototype ---> null
assert.equal(o.a, 1);
assert.equal(o.b, 2); // shadowing: the prototype's b is never reached
assert.equal(o.c, 4); // found one level up
assert.equal(o.d, undefined); // walked to null, not found
assert.equal(Object.getPrototypeOf(Object.getPrototypeOf(o)), Object.prototype);
assert.equal(Object.getPrototypeOf(Object.prototype), null);

// Setting a property creates an OWN property (it doesn't change the prototype).
o.c = 99;
assert.equal(Object.getPrototypeOf(o).c, 4);

// Inherited methods run with `this` = the inheriting object.
const parent = {
  value: 2,
  method() {
    return this.value + 1;
  },
};
const child = { __proto__: parent };
assert.equal(child.method(), 3); // child has no value: found on parent
child.value = 4;
assert.equal(child.method(), 5); // now child's own value shadows it

// --- Constructor functions ---------------------------------------------------
function Box(value) {
  this.value = value;
}
Box.prototype.getValue = function () {
  return this.value;
};
const b1 = new Box(1);
const b2 = new Box(2);
assert.equal(Object.getPrototypeOf(b1), Box.prototype);
assert.equal(Box.prototype.constructor, Box);
assert.equal(b1.getValue, b2.getValue); // ONE shared function, not one per box
assert.equal(Object.getPrototypeOf(Box), Function.prototype); // Box.[[Prototype]] ≠ Box.prototype

// Mutating the prototype changes existing instances too.
Box.prototype.getValue = function () {
  return this.value + 1;
};
assert.equal(b1.getValue(), 2);

// What `new` does, written out by hand (my sketch of MDN's description).
function fakeNew(Ctor, ...args) {
  const obj = Object.create(Ctor.prototype); // 1+2. new object linked to Ctor.prototype
  const result = Ctor.apply(obj, args); // 3. run the constructor with this = obj
  return result !== null && typeof result === "object" ? result : obj; // 4. object wins
}
const b3 = fakeNew(Box, 3);
assert.ok(b3 instanceof Box);
assert.equal(b3.value, 3);

// Literals get their prototype automatically.
assert.equal(Object.getPrototypeOf([]), Array.prototype);
assert.equal(Object.getPrototypeOf({}), Object.prototype);
assert.equal(Object.getPrototypeOf(/abc/), RegExp.prototype);

// Longer chains: the modern way to link two constructors.
function Base() {}
function Derived() {}
Object.setPrototypeOf(Derived.prototype, Base.prototype);
assert.ok(new Derived() instanceof Base);
assert.equal(Derived.prototype.constructor, Derived); // constructor kept (Object.create would lose it)

// Object.create(null): no prototype at all, so no inherited hasOwnProperty.
const dict = Object.create(null);
assert.equal(dict.hasOwnProperty, undefined);
dict.key = 1;
assert.equal(Object.hasOwn(dict, "key"), true); // Object.hasOwn works on it

// Own vs inherited checks.
function Graph() {
  this.vertices = [];
}
Graph.prototype.addVertex = function (v) {
  this.vertices.push(v);
};
const graph = new Graph();
assert.equal(Object.hasOwn(graph, "vertices"), true);
assert.equal(Object.hasOwn(graph, "addVertex"), false);
assert.equal("addVertex" in graph, true); // `in` looks up the chain

// for...in includes inherited ENUMERABLE properties (methods added with = are enumerable).
const keys = [];
for (const k in graph) keys.push(k);
assert.deepEqual(keys, ["vertices", "addVertex"]);
assert.deepEqual(Object.keys(graph), ["vertices"]); // own only

// --- Classes: syntax over the same mechanism --------------------------------
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    return `${this.name} makes a noise.`;
  }
}
class Lion extends Animal {
  speak() {
    return `${super.speak()} ${this.name} roars.`;
  }
}
const lion = new Lion("Fuzzy");
assert.equal(lion.speak(), "Fuzzy makes a noise. Fuzzy roars.");
assert.equal(Object.getPrototypeOf(Lion.prototype), Animal.prototype);
assert.equal(typeof Animal, "function"); // classes are special functions
assert.ok(Object.hasOwn(Animal.prototype, "speak")); // methods live on the prototype
assert.deepEqual(Object.keys(Animal.prototype), []); // ...and class methods are NOT enumerable

// A class can't be called without new (MDN `this` page: class constructors are always called with new).
assert.throws(() => Animal("x"), TypeError);

// Classes have a TDZ like let/const.
assert.throws(() => {
  new Later();
  class Later {}
}, ReferenceError);

// Derived constructors must call super() before touching this.
class Good extends Animal {}
class Bad extends Animal {
  constructor() {} // never calls super()
}
new Good("ok");
assert.throws(() => new Bad(), ReferenceError);

// Static members belong to the class, not instances.
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  static displayName = "Point";
  static distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
}
const p1 = new Point(5, 5);
const p2 = new Point(10, 10);
assert.equal(p1.distance, undefined);
assert.equal(Point.displayName, "Point");
assert.equal(Point.distance(p1, p2), 7.0710678118654755);

// Private fields: declared up front, invisible outside the class body.
class Account {
  #balanceCents = 0;
  deposit(cents) {
    this.#balanceCents += cents;
    return this.#balanceCents;
  }
}
const acct = new Account();
assert.equal(acct.deposit(500), 500);
assert.equal(Object.keys(acct).length, 0);
// Accessing acct.#balanceCents outside the class is a SyntaxError at parse time.
assert.throws(() => new Function("a", "return a.#balanceCents"), SyntaxError);

// Instance field initialisers run at the start of the constructor (base class)
// or right after super() returns (derived class).
const order = [];
class Parent {
  parentField = order.push("parent field");
  constructor() {
    order.push("parent constructor");
  }
}
class Kid extends Parent {
  kidField = order.push("kid field");
  constructor() {
    order.push("kid before super");
    super();
    order.push("kid after super");
  }
}
new Kid();
assert.deepEqual(order, [
  "kid before super",
  "parent field",
  "parent constructor",
  "kid field",
  "kid after super",
]);

// Monkey patching built-ins is a misfeature: shown only to prove methods are just properties.
assert.equal(typeof Array.prototype.map, "function");
assert.ok(Array.isArray(Array.prototype)); // legacy quirk: Array.prototype is an array

console.log("04-prototypes-classes: all checks passed");
