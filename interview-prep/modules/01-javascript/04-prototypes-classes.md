# 04. Prototypes and classes

Also flagged in the micro1 Senior Frontend interview (24 Nov 2026): "older JS syntax", meaning constructor functions and prototypes.

**Sources (MDN, read in full, snapshot of 25 Nov 2026):**
- [Inheritance and the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain)
- [Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)

**Run the checks:** `node interview-prep/modules/01-javascript/examples/04-prototypes-classes.js`

**Replaces:** old guide J12.

## Explain

### The chain
- Every object has an internal link, `[[Prototype]]`, to another object, and so on until `null`. That's the **prototype chain**.
- Reading a property: look on the object (**own** property), then its prototype, then that one's prototype… until found or `null` (then `undefined`).
- An own property with the same name **shadows** the one further up.
- **Writing** a property creates an own property. It doesn't change the prototype (unless a setter intercepts it).
- An inherited method runs with `this` = the object you called it on, so `child.method()` reads `child`'s values.

### Reading and setting the prototype
- `Object.getPrototypeOf(obj)` / `Object.setPrototypeOf(obj, proto)`.
- `{ __proto__: proto }` **inside an object literal** is standard and fine.
- `obj.__proto__ = x` (the accessor) is non-standard and deprecated. Use `Object.setPrototypeOf`.
- Prefer setting the prototype **at creation** (literal `__proto__`, `Object.create`, a constructor, `class`). Changing it later "disrupts all optimizations" engines made (MDN).

### Two different "prototypes"
- `obj.[[Prototype]]`: the object `obj` inherits from.
- `Fn.prototype`: a property on a function, which becomes the `[[Prototype]]` of objects made with `new Fn()`.
- `Object.getPrototypeOf(new Box()) === Box.prototype`, but `Object.getPrototypeOf(Box) === Function.prototype`.
- `Box.prototype.constructor === Box` by default, so any instance can find its constructor.

### Constructor functions (the older syntax)
```js
function Box(value) { this.value = value; }
Box.prototype.getValue = function () { return this.value; };
const boxes = [new Box(1), new Box(2)];
```
- Methods on `Box.prototype` exist **once** and are shared by every box. Defining them inside the constructor would create a new copy per box.
- Mutating `Box.prototype` later changes existing instances too.
- **Don't reassign** `Box.prototype = {…}`: instances made before and after point at different objects, and `constructor` is lost.
- Methods added with `=` are enumerable, unlike class methods (MDN calls constructors "hard to do properly" for this reason).

### What `new` does (MDN conclusion section)
1. Creates an object in memory.
2. Sets its `[[Prototype]]` to `Fn.prototype`.
3. Runs `Fn` with `this` = that object.
4. Returns it, unless `Fn` returned a different object.

### Longer chains
- Modern: `Object.setPrototypeOf(Derived.prototype, Base.prototype)`. Same chain as `class Derived extends Base`.
- Legacy: `Derived.prototype = Object.create(Base.prototype)`. MDN says don't: it replaces `prototype` and loses `constructor`.

### Ways to create objects with a chain (MDN's comparison)

| Way | Notes |
|---|---|
| Literal `{ … }` / `{ __proto__: p }` | Most common; `__proto__` key is standard and optimised |
| Constructor + `new` | Fast and old; methods enumerable by default |
| `Object.create(p, descriptors)` | Can make `Object.create(null)` objects with no prototype; descriptors are verbose |
| `class` | Most readable; private elements; MDN says less optimised than constructor functions |
| `Object.setPrototypeOf` on an existing object | Slow (de-optimises) |
| `obj.__proto__ =` | Deprecated |

### Built-in prototypes
- `[]` inherits from `Array.prototype` (that's where `map` lives); `{}` from `Object.prototype`; `/re/` from `RegExp.prototype`.
- **Monkey patching** (adding methods to built-in prototypes) is a misfeature. It caused "SmooshGate". The only good reason is a polyfill for a newer standard feature.

### Own vs inherited checks
- `Object.hasOwn(obj, "k")` or `obj.hasOwnProperty("k")`: own only.
- `"k" in obj`: anywhere on the chain.
- `for...in` includes **inherited enumerable** properties; `Object.keys` is own only.
- Checking `obj.k === undefined` isn't enough: the property may exist with the value `undefined`.
- Missing properties walk the **whole** chain, so very deep chains cost lookups.

### Classes
- Classes are "special functions" built on prototypes; they don't add a new inheritance model.
- Class declarations have a **TDZ** like `let` (you can't use them before the line).
- The body is always **strict**.
- Elements: kind (method, getter, setter, field) × place (instance or static) × visibility (public or `#private`).
- **Methods** go on the prototype (shared, non-enumerable). **Fields** go on each instance.
- One `constructor` per class (SyntaxError for a second).
- `extends` sets up the chain; a derived constructor must call `super()` before using `this`, or ReferenceError.
- `super.method()` calls the parent's method.
- `static` members live on the class, not instances.
- `#private` fields must be declared in the class body, can't be added later, and are a SyntaxError outside the class.

### Class evaluation order (MDN)
1. `extends` is evaluated (must be a constructor or `null`).
2. The constructor is taken (or a default one).
3. Property keys are evaluated in order (computed keys use the **outer** `this`).
4. Methods and accessors are installed: instance ones on `prototype`, static ones on the class.
5. The class is initialised. Using its name before this throws ReferenceError.
6. Field values: **instance** field initialisers are saved and run when an instance is created (at the start of the constructor for a base class, right after `super()` returns for a derived one); **static** fields and static blocks run now, with `this` = the class.

## Worked examples (checked in the example file)

```js
const o = { a: 1, b: 2, __proto__: { b: 3, c: 4 } };
// { a: 1, b: 2 } ---> { b: 3, c: 4 } ---> Object.prototype ---> null
o.b; // 2 (shadowing)    o.c; // 4    o.d; // undefined

const parent = { value: 2, method() { return this.value + 1; } };
const child = { __proto__: parent };
child.method();        // 3
child.value = 4;
child.method();        // 5

class Animal {
  constructor(name) { this.name = name; }
  speak() { return `${this.name} makes a noise.`; }
}
class Lion extends Animal {
  speak() { return `${super.speak()} ${this.name} roars.`; }
}
new Lion("Fuzzy").speak(); // "Fuzzy makes a noise. Fuzzy roars."

// Field initialisers vs constructors, in a parent and child class (order checked by running):
// "kid before super", "parent field", "parent constructor", "kid field", "kid after super"
```

## Traps
- Thinking classes copy methods into each object. They don't: one copy on the prototype.
- An arrow-function class field **is** copied per instance (it's a field, not a method).
- Forgetting `super()` in a derived constructor.
- Calling an old-style constructor without `new`: `this` is `undefined` (strict) or the global object (sloppy).
- `for...in` showing inherited methods on old-style constructor objects.
- `Object.create(null)` objects have no `hasOwnProperty`: use `Object.hasOwn`.
- Patching built-in prototypes.

## Practice questions

**Q1. What's the prototype chain?**
Each object links to another object, its prototype. When a property isn't on the object, lookup continues up the links until it's found or reaches `null`. It's how arrays get `map`: it lives on `Array.prototype`.

**Q2. Are classes "real" classes?**
They're syntax over constructor functions and prototypes, with extras: strict mode, a TDZ, non-enumerable methods, `super`, static blocks and true `#private` fields. The inheritance model underneath is still prototypes.

**Q3. Rewrite this class in the older syntax:**
```js
class Booking {
  constructor(id) { this.id = id; this.status = "pending"; }
  confirm() { this.status = "confirmed"; }
}
```
```js
function Booking(id) { this.id = id; this.status = "pending"; }
Booking.prototype.confirm = function () { this.status = "confirmed"; };
```
Same chain. Differences: the class version can't be called without `new`, has a TDZ, and its method isn't enumerable.

**Q4. What does `new` do?**
Creates an object, links its prototype to `Fn.prototype`, runs `Fn` with `this` set to it, and returns it unless `Fn` returns another object.

**Q5. Why put methods on the prototype instead of inside the constructor?**
One shared function instead of a new one per instance: less memory, and changing the prototype updates every instance.

**Q6. Difference between `Box.prototype` and `Object.getPrototypeOf(Box)`?**
`Box.prototype` is what instances inherit from. `Object.getPrototypeOf(Box)` is what the function `Box` itself inherits from: `Function.prototype`.

**Q7. Predict the order of the five log lines** in the field-initialiser example above, then explain it.
`kid before super` (derived constructor starts), `parent field` (base fields run at the start of the base constructor), `parent constructor`, `kid field` (derived fields run right after `super()` returns), `kid after super`.

**Q8. Why is monkey patching built-ins a bad idea?**
If the language later adds a method with the same name but different behaviour, your code (or the web) breaks. MDN points to SmooshGate. Only polyfilling a real standard feature is acceptable.

**Q9. Composition vs inheritance?**
My view, not an MDN statement: prefer composition ("has a") for things like a booking that *has* a payment provider, and keep inheritance for true "is a" relationships, because deep chains are rigid and every missing-property lookup walks the whole chain.

## Say it (about 45 seconds)
"Every object links to a prototype, and property lookups walk up that chain until they find the property or hit null; that's how arrays get `map` from `Array.prototype`. A constructor function's `prototype` property becomes the prototype of everything made with `new`, so methods there are shared once. `new` creates the object, links it, runs the constructor with `this` set to it, and returns it. Classes are syntax over the same thing, plus strict mode, `super`, statics and real private fields. Methods go on the prototype; fields, including arrow-function fields, go on each instance."
