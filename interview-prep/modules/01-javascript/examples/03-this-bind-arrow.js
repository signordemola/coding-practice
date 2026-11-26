// Topic 03: `this`, call/apply/bind, arrow functions. This file is a module, so it's strict.
// Run: node interview-prep/modules/01-javascript/examples/03-this-bind-arrow.js
import assert from "node:assert/strict";

// --- 1. Method call: `this` is the object BEFORE THE DOT at call time -------
function getThis() {
  return this;
}
const obj1 = { name: "obj1", getThis };
const obj2 = { name: "obj2", getThis };
assert.equal(obj1.getThis(), obj1);
assert.equal(obj2.getThis(), obj2);

// It's the object used to call, not the object that owns the function.
const obj3 = { __proto__: obj1, name: "obj3" };
assert.equal(obj3.getThis(), obj3);

// --- 2. Plain call: undefined in strict code --------------------------------
assert.equal(getThis(), undefined);

// Losing `this`: extracting a method gives you just the function.
const booking = {
  status: "pending",
  confirm() {
    this.status = "confirmed";
  },
};
const confirm = booking.confirm;
assert.throws(() => confirm(), TypeError); // this is undefined → can't set .status

// --- 3. call / apply / bind -------------------------------------------------
function add(c, d) {
  return this.a + this.b + c + d;
}
const o = { a: 1, b: 3 };
assert.equal(add.call(o, 5, 7), 16); // runs now, args one by one
assert.equal(add.apply(o, [10, 20]), 34); // runs now, args as an array
const bound = add.bind(o, 5); // doesn't run: new function, this + first arg fixed
assert.equal(bound(7), 16);

// bind only works once: re-binding can't change `this` (arguments still stack up).
function f() {
  return this.a;
}
const g = f.bind({ a: "azerty" });
const h = g.bind({ a: "yoo" });
assert.equal(h(), "azerty");

function log(...args) {
  return [this, ...args];
}
const boundLog2 = log.bind("this value", 1, 2).bind("new this value", 3, 4);
assert.deepEqual(boundLog2(5, 6), ["this value", 1, 2, 3, 4, 5, 6]);

// Bound function metadata.
assert.equal(bound.name, "bound add");
assert.equal(bound.length, 1); // add has 2 params, 1 is bound

// Partial application.
const addThirtySeven = ((a, b) => a + b).bind(null, 37);
assert.equal(addThirtySeven(5), 42);

// --- 4. new: `this` is the new object ---------------------------------------
function C() {
  this.a = 37;
}
assert.equal(new C().a, 37);
function C2() {
  this.a = 37;
  return { a: 38 }; // returning an object replaces the new instance
}
assert.equal(new C2().a, 38);

// new on a bound function ignores the bound `this` but keeps bound arguments.
function Point(x, y) {
  this.x = x;
  this.y = y;
}
const YAxisPoint = Point.bind(null, 0);
const p = new YAxisPoint(5);
assert.deepEqual({ ...p }, { x: 0, y: 5 });
assert.ok(p instanceof Point && p instanceof YAxisPoint);

// --- 5. Arrow functions: no own `this`, they use the surrounding one --------
const timer = {
  seconds: 0,
  tickWithArrow() {
    [1, 2].forEach(() => this.seconds++); // arrow → method's this = timer
  },
  tickWithFunction() {
    [1, 2].forEach(function () {
      this.seconds++; // regular callback → this is undefined (strict)
    });
  },
};
timer.tickWithArrow();
assert.equal(timer.seconds, 2);
assert.throws(() => timer.tickWithFunction(), TypeError);

// forEach's thisArg sets `this` for a regular callback (ignored for arrows).
const seen = [];
[1].forEach(function () {
  seen.push(this.name);
}, { name: "thisArg" });
assert.deepEqual(seen, ["thisArg"]);

// call/apply/bind can't change an arrow's `this`.
const arrowThis = () => this; // module top level: this is undefined
assert.equal(arrowThis.call({ x: 1 }), undefined);
assert.equal(arrowThis.bind({ x: 1 })(), undefined);

// Arrow as an object method: `this` is NOT the object.
const counter = {
  count: 10,
  arrow: () => this, // takes the module's this (undefined)
  method() {
    return this;
  },
};
assert.equal(counter.arrow(), undefined);
assert.equal(counter.method(), counter);

// The getter-of-getter pattern: arrow captures the `this` of the call that created it.
const holder = {
  getThisGetter() {
    return () => this;
  },
};
const fn = holder.getThisGetter();
assert.equal(fn(), holder);
const fn2 = holder.getThisGetter; // unbound method
assert.equal(fn2()(), undefined); // strict: the outer call had no this

// --- 6. Classes are strict: extracted methods lose `this` -------------------
class Car {
  constructor() {
    this.sayBye = this.sayBye.bind(this); // bound once per instance
  }
  get name() {
    return "Ferrari";
  }
  sayHi() {
    return `Hello from ${this.name}`;
  }
  sayBye() {
    return `Bye from ${this.name}`;
  }
}
class Bird {
  get name() {
    return "Tweety";
  }
}
const car = new Car();
const bird = new Bird();
bird.sayHi = car.sayHi;
assert.equal(bird.sayHi(), "Hello from Tweety"); // depends on the caller
bird.sayBye = car.sayBye;
assert.equal(bird.sayBye(), "Bye from Ferrari"); // bound: doesn't
const loose = car.sayHi;
assert.throws(() => loose(), TypeError);

// Arrow class field: an "auto-bound method" (one copy per instance).
class Auto {
  a = 1;
  read = () => this.a;
}
const { read } = new Auto();
assert.equal(read(), 1);
assert.notEqual(new Auto().read, new Auto().read); // a new function per instance

// Field initialisers: instance fields see the instance, static fields see the class.
class Ctx {
  instanceField = this;
  static staticField = this;
}
const ctx = new Ctx();
assert.equal(ctx.instanceField, ctx);
assert.equal(Ctx.staticField, Ctx);

// --- 7. Getters use the object the property is read from --------------------
const stats = {
  a: 1,
  b: 2,
  c: 3,
  get average() {
    return (this.a + this.b + this.c) / 3;
  },
};
assert.equal(stats.average, 2);

// --- 8. Module top level ------------------------------------------------------
assert.equal(this, undefined); // ES modules: top-level this is undefined

console.log("03-this-bind-arrow: all checks passed");
