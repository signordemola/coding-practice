# 03. `this`, `call` / `apply` / `bind`, arrow functions

This was a gap in the micro1 Senior Frontend interview (24 Nov 2026), so it gets extra drills.

**Sources (MDN, read in full, snapshot of 25 Nov 2026):**
- [`this`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)
- [`Function.prototype.bind()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)
- [Arrow function expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
- [Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes) (binding section) · [`addEventListener`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) (`this` in handlers)

**Run the checks:**
- `node interview-prep/modules/01-javascript/examples/03-this-bind-arrow.js` (strict, like all modules)
- `node interview-prep/modules/01-javascript/examples/03-this-sloppy.cjs` (old sloppy behaviour)

**Replaces:** old guide J11. The React class-component part moves to module 03 (React).

## Explain

### The one rule
`this` depends on **how a function is called**, not where it's written. MDN: think of it as a hidden parameter the language fills in at call time.

### The cases, checked in this order

| How it's called | `this` is | Example |
|---|---|---|
| `new Fn()` | the new object (unless the constructor returns another object) | `new Booking()` |
| a bound function (`bind`) | the bound value, permanently | `fn.bind(obj)()` |
| `fn.call(x, …)` / `fn.apply(x, [...])` | `x` for that one call | `add.call(o, 5, 7)` |
| `obj.fn()` | `obj`, the object **before the dot** | `booking.confirm()` |
| `fn()` plain call | strict: `undefined` · sloppy: `globalThis` | `const f = booking.confirm; f()` |
| arrow function | no own `this`: the `this` of the surrounding code, fixed when created | `() => this.count` |

The order is my summary of MDN's sections; each row's behaviour is checked in the example file.

### Details MDN makes a point of
- It's the object used **to call** the function, not the one that owns it. Calling a method found up the prototype chain gives `this` = the object you called it on.
- **Strict vs sloppy:** in sloppy code, "this substitution" turns `undefined`/`null` into `globalThis` and boxes primitives (`7` becomes a `Number` object). Strict code (all modules and classes) keeps them as they are.
- **Callbacks:** the API that calls your callback decides `this`. Array iterative methods and the `Promise()` constructor call it with `undefined`. Array methods accept a `thisArg`. (In Node, I checked that a `setTimeout` callback gets the Timeout object as `this`; browsers use `window`.)
- **Getters and setters:** `this` is the object the property is read from.
- **DOM listeners** (regular functions): `this` is the element the listener is on, the same as `event.currentTarget`.
- **Top level:** a classic script gets `globalThis`; an ES module gets `undefined`; a Node CommonJS file gets `module.exports`.
- **Object literals** don't create a `this`. `{ a: this }` uses the outer `this`.
- **`super.method()`** runs with the current `this`, not the parent object.

### `call`, `apply`, `bind`
- `call(thisArg, a, b)`: run now, arguments one by one.
- `apply(thisArg, [a, b])`: run now, arguments as an array.
- `bind(thisArg, a)`: **don't run**. Return a new function with `this` fixed and `a` added in front of later arguments (partial application).
- Binding again can't change `this`; the extra arguments still stack up.
- A bound function's `name` is `"bound " + name`; its `length` drops by the number of bound arguments.
- `new` on a bound function ignores the bound `this` but keeps the bound arguments. Bound functions have no `prototype`, so you can't `extends` them.

### Arrow functions (MDN's list of differences)
- No own `this`, `arguments` or `super`. Don't use them as object methods.
- `call`/`apply`/`bind` can't change their `this` (the `thisArg` is ignored; other arguments still work).
- Can't be used with `new` (TypeError) and have no `prototype`.
- Can't be generators.
- Returning an object needs brackets: `() => ({ foo: 1 })`. Without them, `{ foo: 1 }` is read as a block with a label, so it returns `undefined`.
- No line break allowed between the parameters and `=>`.
- `callback || () => {}` is a SyntaxError; write `callback || (() => {})`.

### Classes
- Class bodies are always strict, so an extracted method called plainly gets `this` = `undefined` and throws when it reads a property.
- Fixes, all on MDN:
  1. Bind in the constructor: `this.handle = this.handle.bind(this)`.
  2. An arrow class field: `handle = () => { … }` ("auto-bound method").
  3. For event listeners: pass an object with `handleEvent()`.
- Both 1 and 2 create **one function per instance** (more memory). MDN says to use them only where needed.
- Instance field initialisers run with `this` = the instance; static ones with `this` = the class.
- A derived constructor has no `this` until `super()` runs.

## Worked examples (checked in the example files)

```js
const booking = { status: "pending", confirm() { this.status = "confirmed"; } };
booking.confirm();                 // this = booking
const confirm = booking.confirm;
confirm();                         // TypeError in strict code: this is undefined

function add(c, d) { return this.a + this.b + c + d; }
const o = { a: 1, b: 3 };
add.call(o, 5, 7);                 // 16
add.apply(o, [10, 20]);            // 34
add.bind(o, 5)(7);                 // 16

function f() { return this.a; }
f.bind({ a: "azerty" }).bind({ a: "yoo" })(); // "azerty": bind only works once

const timer = {
  seconds: 0,
  tick() {
    [1, 2].forEach(() => this.seconds++);            // arrow: this = timer ✔
    // [1, 2].forEach(function () { this.seconds++; }); // TypeError: this is undefined
  },
};

const holder = { getThisGetter() { return () => this; } };
holder.getThisGetter()();          // holder
const loose = holder.getThisGetter;
loose()();                         // undefined (strict): the outer call had no this

class Car {
  constructor() { this.sayBye = this.sayBye.bind(this); }
  get name() { return "Ferrari"; }
  sayHi() { return `Hello from ${this.name}`; }
  sayBye() { return `Bye from ${this.name}`; }
}
class Bird { get name() { return "Tweety"; } }
const car = new Car(), bird = new Bird();
bird.sayHi = car.sayHi;  bird.sayHi();   // "Hello from Tweety"
bird.sayBye = car.sayBye; bird.sayBye(); // "Bye from Ferrari" (bound)
```

Sloppy-mode version (from `03-this-sloppy.cjs`):
```js
function getThis() { return this; }
getThis() === globalThis;   // true in sloppy code
typeof getThis.call(7);     // "object": 7 was boxed into a Number
```

## Traps
- Passing `obj.method` as a callback (`setTimeout(obj.method)`, `addEventListener("click", obj.method)`) hands over **only the function**. `this` is lost.
- An arrow function as an object method: `this` is the outer scope's, not the object.
- `removeEventListener("click", fn.bind(x))` removes nothing: every `bind` makes a new function. Keep the bound reference.
- A constructor that returns an object replaces the new instance.
- Calling `this` before `super()` in a derived constructor throws ReferenceError.

## Practice questions

**Q1. What decides `this`?**
How the function is called. `new` → the new object; `bind` → the bound value; `call`/`apply` → the first argument; `obj.fn()` → `obj`; a plain call → `undefined` in strict code, `globalThis` in sloppy code. Arrow functions don't have their own; they use the surrounding `this`.

**Q2. `call` vs `apply` vs `bind`?**
`call` and `apply` run the function now with the `this` you give; `call` takes arguments one by one, `apply` as an array. `bind` doesn't run it: it returns a new function with `this` (and optionally the first arguments) fixed.

**Q3. Predict:**
```js
const obj = {
  count: 10,
  later() { setTimeout(function () { this.count++; console.log(this.count); }, 0); },
};
obj.later();
```
`NaN`. The regular callback isn't called on `obj` (Node gives it the Timeout object, browsers `window`), so `this.count` is `undefined` and `undefined + 1` is `NaN`. An arrow callback logs `11`.

**Q4. Predict:**
```js
const g = function () { return this.a; }.bind({ a: 1 });
const h = g.bind({ a: 2 });
console.log(h(), g.call({ a: 3 }));
```
`1 1`. A bound function's `this` can't be changed by another `bind` or by `call`.

**Q5. Why shouldn't an arrow function be an object method?**
It has no own `this`, so `this` is whatever it was where the object literal was written (often `undefined` in a module), not the object.

**Q6. In a class, how do you pass a method as a callback safely? What does each fix cost?**
Bind it in the constructor, make it an arrow class field, or wrap it at the call site: `() => this.method()`. The first two create a function per instance instead of sharing one on the prototype.

**Q7. What's `this` at the top level of an ES module? Of a CommonJS file? Of a classic browser script?**
`undefined`; `module.exports`; `globalThis` (which is `window`).

**Q8. Predict:**
```js
function Point(x, y) { this.x = x; this.y = y; }
const YAxisPoint = Point.bind(null, 0);
const p = new YAxisPoint(5);
console.log(p.x, p.y, p instanceof Point);
```
`0 5 true`. `new` ignores the bound `this` but keeps the bound `0`, and `instanceof` uses the target function.

## Say it (about 45 seconds)
"`this` is set by how a function is called, like a hidden argument. With `new` it's the new object; a bound function always uses its bound value; `call` and `apply` set it for one call; `obj.method()` gives `obj`, the object before the dot; and a plain call gives `undefined` in strict code. Arrow functions have no own `this`: they take it from where they were written, which is why they're good for callbacks inside methods and bad as methods. The classic bug is passing `obj.method` as a callback and losing `this`; I fix it with `bind`, an arrow wrapper, or an arrow class field, knowing the last two create a function per instance."
