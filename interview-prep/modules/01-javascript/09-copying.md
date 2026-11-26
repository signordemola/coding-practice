# 09. Copying: shallow, deep, JSON and `structuredClone`

**Sources (MDN, read in full, snapshot of 25 Nov 2026):**
- [Shallow copy (glossary)](https://developer.mozilla.org/en-US/docs/Glossary/Shallow_copy) · [Deep copy (glossary)](https://developer.mozilla.org/en-US/docs/Glossary/Deep_copy)
- [`structuredClone()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone) · [The structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)

**Run the checks:** `node interview-prep/modules/01-javascript/examples/09-copying.js`

## Explain

### Three levels
- **Assignment** (`const b = a`): no copy. Two names, one object.
- **Shallow copy:** a new top-level object whose properties point at the **same** values. Change a top-level property of the copy: the original is unaffected. Change something **nested**: both see it.
- **Deep copy:** shares no references with the source. Changing either never affects the other.

### Every built-in copy is shallow
MDN lists them: spread (`{...o}`, `[...a]`), `Array.prototype.concat()`, `slice()`, `Array.from()`, `Object.assign()`.

### Deep copy option 1: the JSON round-trip
`JSON.parse(JSON.stringify(x))`. Fully independent, but only for data JSON can represent. What happens to everything else (checked by running in Node 22):

| In the source | After the round-trip |
|---|---|
| a function, a symbol or `undefined` as an object property | **dropped silently** |
| the same inside an array | becomes `null` |
| a `Date` | an ISO **string** |
| a `Map` or `Set` | `{}` |
| a circular reference | **TypeError** |
| a `BigInt` | **TypeError** |

MDN's deep-copy page says functions, symbols, DOM objects and recursive data aren't serialisable; the table above is what Node actually does with each.

### Deep copy option 2: `structuredClone(value, { transfer })`
- Deep-copies with the **structured clone algorithm** (the same one used by `postMessage` to workers and by IndexedDB).
- **Handles circular references**: a clone of `o` with `o.itself = o` has `clone.itself === clone`.
- **Keeps types** JSON loses: `Date`, `Map`, `Set`, `RegExp`, `ArrayBuffer` and typed arrays, `Error` types (name and message, and usually `stack` and `cause`), `Blob`, `File` and more.
- **Throws `DataCloneError`** for functions and DOM nodes. Symbols aren't supported either.
- **Doesn't copy:**
  - the **prototype chain**: a class instance comes back as a plain object (checked: `instanceof` is false, getters from the class are gone);
  - property descriptors, getters and setters (a read-only property becomes writable);
  - `#private` fields;
  - `RegExp.lastIndex`.
- **Transfer:** listing a transferable object (like an `ArrayBuffer`) in `transfer` **moves** it instead of copying. The original becomes unusable (its `byteLength` is 0). MDN's use case: validate a buffer asynchronously without anyone changing it meanwhile.
- It's a host (web platform) API, not part of the JavaScript language. Browsers, Node and Deno provide it.

### What a real deep copy has to decide (MDN glossary)
Libraries differ on: non-enumerable and symbol properties, accessors (copy the getter or its value?), prototype properties, and which built-in types they can copy. There's no single "correct" deep copy, which is why there isn't a generic one in the language.

## Worked examples (checked in the example file)

```js
const booking = { id: "b1", client: { name: "Ada" } };
const spread = { ...booking };
spread.id = "b2";              // booking.id is still "b1"
spread.client.name = "Grace";  // booking.client.name is now "Grace" too

JSON.parse(JSON.stringify({ a: 1, when: new Date(0), fn() {}, missing: undefined }));
// { a: 1, when: "1970-01-01T00:00:00.000Z" }

const original = { name: "MDN", prices: new Map([["cut", 3500]]) };
original.itself = original;
const clone = structuredClone(original);
clone.itself === clone;        // true
clone.prices.set("cut", 4000); // original still 3500

class Money { constructor(c) { this.cents = c; } get dollars() { return this.cents / 100; } }
const m = structuredClone(new Money(1250));
m instanceof Money;            // false
m.cents;                       // 1250
m.dollars;                     // undefined

structuredClone({ fn() {} });  // DataCloneError
```

## Traps
- "I copied the state with spread, so it's safe to change": only the top level is.
- JSON round-trips quietly turning Dates into strings and dropping fields.
- `structuredClone` on a class instance and then calling its methods: they're gone.
- Cloning something that contains a function (an object with a callback, a store with methods) throws.
- Transferring a buffer and then using the original.

## Practice questions

**Q1. Shallow vs deep copy?**
A shallow copy is a new outer object whose properties point at the same values, so nested objects are shared. A deep copy recreates everything, so nothing is shared. Every built-in copy (spread, slice, concat, Array.from, Object.assign) is shallow.

**Q2. How do you deep-copy in modern JavaScript, and what are the limits?**
`structuredClone(value)`. It handles cycles and keeps Dates, Maps, Sets and errors, but throws on functions and DOM nodes and returns class instances as plain objects (no prototype, no getters, no private fields).

**Q3. What's wrong with `JSON.parse(JSON.stringify(x))`?**
It drops functions, symbols and undefined properties without a warning, turns Dates into strings and Maps into `{}`, and throws on cycles and BigInts. Fine for plain JSON-shaped data only.

**Q4. Predict:**
```js
const a = [{ n: 1 }];
const b = a.slice();
b[0].n = 2;
b.push({ n: 3 });
console.log(a);
```
`[{ n: 2 }]`. `slice` made a new array (so the push doesn't affect `a`), but the object inside is shared.

**Q5. When would you transfer instead of clone?**
When moving a large buffer to a worker or into a new object, and the original must not be used or changed afterwards: transferring avoids the copy and makes the original unusable.

## Say it (about 30 seconds)
"Assignment doesn't copy; spread, slice, concat, Array.from and Object.assign make shallow copies, so nested objects are still shared. For a deep copy I use `structuredClone`: it handles cycles and keeps Dates, Maps and Sets, but it throws on functions and DOM nodes and loses prototypes, so class instances come back as plain objects. The JSON trick only works for plain data: it silently drops functions and undefined, turns Dates into strings, and throws on cycles."
