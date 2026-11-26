# 08. `Map`, `Set`, `WeakMap`, `WeakSet` (the hashing tools)

**Sources (MDN, read in full, snapshot of 25 Nov 2026):**
- [Keyed collections (guide)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Keyed_collections)
- [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) · [`Set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) · [`WeakMap`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)

**Run the checks:** `node interview-prep/modules/01-javascript/examples/08-map-set-weak.js`

**Practise the patterns** (counting, duplicates, grouping, two-sum, top K, first unique, simulation) in `lesson-04/`. This page deliberately doesn't solve them, so the drill stays a real test. It gives you the tools and the reasons.

**Replaces:** the tool parts of old guide Part F (P0–P6).

## Explain

### Why a `Map` or `Set` (the one big idea)
- Looking up a key in a `Map` or a value in a `Set` is fast. The spec requires access times that are "sublinear" on average, so engines use something like a hash table (about O(1)) or a tree (O(log n)), "as long as the complexity is better than O(N)" (MDN).
- An array search (`indexOf`, `includes`) checks items one by one: O(n). MDN also notes `Set.has` is on average faster than `Array.prototype.includes` for the same number of items.
- So one pass with a `Map`/`Set` as a lookup table usually beats a nested loop: O(n) instead of O(n²). (The Big-O conclusion is my reasoning from those two facts.)

### `Map`
- Key/value pairs; **any** value can be a key (objects, functions, numbers, `NaN`).
- Keys are unique and iterate in **insertion order** (the order of the first `set`; setting an existing key again doesn't move it).
- API: `set(k, v)` (returns the map, so it chains), `get(k)` (`undefined` if missing), `has(k)`, `delete(k)` (returns a boolean), `clear()`, `size`.
- Iterating: `for (const [k, v] of map)`, `keys()`, `values()`, `entries()`, and `forEach((value, key) => …)`. **Note: value comes first** in `forEach`.
- Newer: `getOrInsert(key, default)` and `getOrInsertComputed(key, fn)`. On MDN, but **not in Node 22**; the example file only checks them where they exist.

**Key equality is SameValueZero:** like `===` (objects compared by **identity**), except `NaN` matches `NaN`. `map.get({})` never finds an entry added with a different `{}`.

### `Map` vs plain object (MDN's table)

| | `Map` | Object |
|---|---|---|
| Accidental keys | none | inherits keys like `toString` (avoid with `Object.create(null)`) |
| Security | safe with user-provided keys | user keys can override the prototype ("prototype pollution", "object injection") |
| Key types | anything | strings and symbols only (`1` and `"1"` are the same key) |
| Order | insertion order | complex rules; "best not to rely on" it |
| Size | `size` | count `Object.keys(obj).length` |
| Iteration | directly iterable | not iterable; use `Object.keys`/`entries` |
| Frequent add/remove | performs better | not optimised for it |
| JSON | no native support | `JSON.stringify` / `JSON.parse` |

MDN's rule of thumb: use a `Map` when keys are unknown until run time (especially from external input); use an object when the shape is known and keys are strings.

**Trap:** `map["x"] = 1` sets an object **property** on the Map, not an entry. `map.has("x")` is false.

Conversions: `new Map(entriesArray)`, `[...map]` / `Array.from(map)`, `Object.fromEntries(map)`, `new Map(Object.entries(obj))`. Clone (shallow): `new Map(original)`. Merge (last wins): `new Map([...a, ...b])`.

### `Set`
- Unique values, insertion order, same SameValueZero equality (so it can hold and find `NaN`; `indexOf` can't).
- API: `add(v)` (chains), `has(v)`, `delete(v)`, `clear()`, `size`, iteration like `Map` (`entries()` gives `[v, v]`).
- Deleting then re-adding puts the value at the **end**.
- Remove duplicates, keeping first-seen order: `[...new Set(list)]`.
- MDN on arrays vs sets: deleting from an array by value (`arr.splice(arr.indexOf(v), 1)`) is slow; a Set deletes by value and tracks uniqueness for you.
- **Set methods** (return a new Set or a boolean): `union`, `intersection`, `difference`, `symmetricDifference`, `isSubsetOf`, `isSupersetOf`, `isDisjointFrom`. The argument must be **set-like** (`size`, `has()`, `keys()`): a `Map` works (its keys are used); an **array doesn't** (TypeError), so wrap it in `new Set(arr)`.

### `WeakMap` and `WeakSet`
- Keys (`WeakMap`) or values (`WeakSet`) must be **objects or non-registered symbols** (things that can be garbage collected). `Symbol.for("x")` can be re-created, so it's not allowed.
- They're **weak**: being in the collection doesn't keep an object alive. When nothing else references the key, the entry can be collected.
- So they're **not enumerable**: no `keys()`, `size` or `clear()`. A list of keys would depend on when garbage collection ran.
- Uses (MDN):
  - **Private data per object** (the pre-`#private` pattern): `privates.set(this, {...})`.
  - **Metadata on objects you don't own**, like DOM nodes: other code can't read or change it, and it disappears when the node is removed.
  - **Caching results by object input**: but the entry lives as long as the key. For string keys and big values, MDN uses a `Map` of `WeakRef`s instead (topic 12).
- `wm.has(k)` is true even if the stored value is `undefined`.

## Worked examples (checked in the example file)

```js
const m = new Map([[1, "number one"], ["1", "string one"]]);
m.get(1);        // "number one"
m.get("1");      // "string one": different keys

const plain = {};
plain[1] = "number one";
plain["1"] = "string one";
Object.keys(plain); // ["1"]: they collided

new Map([[NaN, "nan"]]).get(Number("foo")); // "nan"

const A = new Set([1, 2, 3, 4]), C = new Set([3, 4, 5, 6]);
A.intersection(C);        // Set {3, 4}
A.difference(C);          // Set {1, 2}
A.union([7]);             // TypeError: arrays aren't set-like
A.union(new Set([7]));    // Set {1, 2, 3, 4, 7}

[...new Set([2, 13, 4, 4, 2, 13])]; // [2, 13, 4]
```

## Traps
- Using an object as a counter or lookup with keys that aren't strings: `1` and `"1"` merge, and inherited names like `toString` already "exist".
- `map[key] = value` instead of `map.set(key, value)`.
- Expecting `get({ id: 1 })` to find an entry stored under a different object with the same contents.
- `JSON.stringify(map)` gives `"{}"`. Convert with `Object.fromEntries` first.
- Passing an array to a Set method.
- Expecting to list or count a WeakMap's entries.

## Practice questions

**Q1. Why is a `Map` better than a plain object for counting?**
Keys keep their type (`1` and `"1"` stay separate), there are no inherited keys like `toString` to collide with, user-supplied keys can't pollute a prototype, `size` is built in, it iterates in insertion order, and MDN says it performs better with frequent additions and removals.

**Q2. What does SameValueZero mean for `Map` keys?**
Like `===`: primitives by value, objects by identity. Except `NaN` equals `NaN` (and `+0` equals `-0`). So `NaN` works as a key and `{}` never matches another `{}`.

**Q3. How do you remove duplicates from an array and keep the order?**
`[...new Set(arr)]`. Sets keep insertion order, so the first occurrence of each value stays where it was.

**Q4. Why can't you iterate a `WeakMap`?**
Its keys can be garbage collected at any time. A list of keys would change depending on when the collector ran, which would make programs non-deterministic.

**Q5. When would you choose a `WeakMap` over a `Map`?**
When the data belongs to an object and should disappear with it: metadata on DOM nodes, private data per instance, a cache keyed by the input object. A `Map` would keep those objects alive forever.

**Q6. What's the time cost of `arr.includes(x)` vs `set.has(x)`, and why does it matter in a loop?**
`includes` scans: O(n). `set.has` is sublinear by spec (about constant for a hash table). Inside a loop over n items, that's O(n²) vs about O(n).

**Q7. Predict:** `new Map([["a", 1], ["b", 2]]).set("a", 97)`. What's the key order?
`a`, then `b`. Re-setting an existing key updates the value without moving it.

## Say it (about 40 seconds)
"When I need fast lookups I use a Map or Set as a lookup table: the spec requires better-than-linear access, so one pass with a Map beats a nested loop. I prefer Map over a plain object for dynamic keys: keys keep their type, there are no inherited keys, user input can't pollute a prototype, and it has `size` and insertion order. Keys are compared with SameValueZero, so objects by identity and NaN works. Set gives me uniqueness and now has union, intersection and difference. WeakMap and WeakSet hold their keys weakly, so they're for data tied to an object's lifetime, and that's why they can't be listed."
