# 07. Arrays: indices, copying vs mutating, iteration, `sort`, grouping

Arrays and hashing was the micro1 Senior Frontend coding task (24 Nov 2026). This page covers the **array tools**; the hashing tools are topic 08; the problems themselves are practised in `lesson-04/` (you write the code there; no solutions are kept in this repo).

**Sources (MDN, read in full, snapshot of 25 Nov 2026):**
- [`Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
- [`Array.prototype.sort()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
- [`Object.groupBy()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy)

**Run the checks:** `node interview-prep/modules/01-javascript/examples/07-arrays.js`

## Explain

### What an array is
- An object (not a primitive). Resizable, can mix types, zero-indexed.
- **Not** an associative array: elements are at non-negative integer indices (or their string form). `arr["02"]` is a plain property, not element 2, and isn't visited by array methods.
- `arr.0` is a syntax error; use brackets. `arr.at(-1)` reads from the end.

### `length` and empty slots
- `length` is linked to the indices. Setting `arr[5]` on a 3-item array makes `length` 6, with **empty slots** at 3 and 4 (not `undefined`: `3 in arr` is false).
- Increasing `length` adds empty slots; decreasing it **deletes** elements.
- Older methods skip empty slots (`forEach`, `map`, `filter`, `reduce`, `some`, `every`, `indexOf`, `sort` keeps them at the end…). Newer ones treat them as `undefined` (`find`, `findIndex`, `includes`, `keys`, `values`, `entries`, `toSorted`, `toReversed`, `with`, `join`…).

### Mutating vs copying methods

| Mutates the array | Copying alternative |
|---|---|
| `push(a, b)` → returns new length | `concat([a, b])` |
| `pop()` → returns removed item | `slice(0, -1)` |
| `shift()` → returns removed item | `slice(1)` |
| `unshift(a, b)` → returns new length | `toSpliced(0, 0, a, b)` |
| `splice(start, n, ...items)` → returns removed items | `toSpliced(...)` |
| `reverse()` → returns the same array | `toReversed()` |
| `sort()` → returns the same array | `toSorted()` |
| `fill()`, `copyWithin()` | no one-method version: copy first (`[...a].fill(0)`) |

Plus `with(i, v)` returns a copy with one index replaced.

- **Every copy is shallow.** Spread, `slice`, `concat`, `Array.from`: new array, same element references. Change a nested object and both arrays see it.
- Assigning an array to another variable isn't a copy at all: both names point to one array.

### Iterative methods
`method(callbackFn(element, index, array), thisArg)`
- `forEach`, `map`, `filter`, `find`, `findIndex`, `findLast`, `findLastIndex`, `some`, `every`, `flatMap`.
- `some`, `every` and the `find…` methods **stop early** once the answer is known.
- `reduce` / `reduceRight` take `(accumulator, element, index, array)` and no `thisArg`. Without an initial value, `reduce` on an empty array throws a TypeError, so give one: `reduce((a, b) => a + b, 0)`.
- `findLast`, `findLastIndex` and `reduceRight` go backwards.
- `thisArg` does nothing for arrow callbacks.

**Changing the array while iterating** (MDN: "generally to be avoided"):
- `length` is read **once** at the start, so items pushed during the loop aren't visited.
- Values are read when each index is reached, so a change to a later index **is** seen.
- Removing the current item shifts the rest left, so the **next** item is skipped.

### Generic methods and array-likes
- Array methods only use `length` and indices, so they work on **array-likes** (`arguments`, `NodeList`, `{ 0: "a", length: 1 }`): `Array.prototype.join.call(arrayLike, "+")`.
- `Array.from(iterableOrArrayLike, mapFn)` makes a real array: `Array.from({ length: 3 }, (_, i) => i * i)` → `[0, 1, 4]`.
- `Array.isArray(x)` is the reliable check (it also works across iframes, where `instanceof Array` fails because each realm has its own `Array`: execution model page).

### `sort`
- **Sorts in place and returns the same array.** Use `toSorted()` (or copy first) to keep the original.
- **Default order converts elements to strings** and compares UTF-16 code units. `[1, 30, 4, 21, 100000].sort()` → `[1, 100000, 21, 30, 4]`.
- Pass a comparator: negative → `a` first, positive → `b` first, `0` (or `NaN`) → keep order. `(a, b) => a - b` is ascending for numbers.
- `undefined` goes to the end without calling the comparator; empty slots go after that.
- **Stable** since ES2019: equal items keep their original order. So sort by name, then by grade, and students with the same grade stay in name order.
- A comparator must be pure, consistent, reflexive (`cmp(a, a) === 0`), anti-symmetric and transitive. One that never returns a negative number (`a > b ? 1 : 0`) gives different results in different engines: V8 leaves `[3, 1, 4, 1, 5, 9]` unsorted, while Firefox's engine sorts it.
- Text with accents or other languages: `a.localeCompare(b)`.
- Time and space complexity "cannot be guaranteed": it depends on the engine.
- If computing the sort key is expensive, compute it once per item with `map`, sort that, then map back (MDN "sorting with map").

### Grouping
- `Object.groupBy(items, (item, index) => key)` → a **null-prototype** object `{ key: [items] }`. Keys become strings (or symbols).
- `Map.groupBy(items, fn)` → a `Map`, for keys that aren't strings (objects, numbers you want to keep as numbers).
- The grouped items are the **same objects**, not copies.
- (Part 3 of `lesson-04/` can use `Map.groupBy`, but write it by hand too: interviewers often ask you to.)

## Worked examples (checked in the example file)

```js
const fruits = ["banana", "apple", "peach"];
fruits[5] = "mango";
fruits.length;            // 6
Object.keys(fruits);      // ["0", "1", "2", "5"]
fruits.length = 2;        // ["banana", "apple"]: the rest are deleted

const list = ["Apple", "Banana", "Strawberry", "Mango", "Cherry"];
list.splice(-3);          // removes and returns ["Strawberry", "Mango", "Cherry"]
["a", "b", "c"].splice(1, 1, "X"); // removes "b", inserts "X"

const nested = ["noodles", { list: ["eggs"] }];
const copy = [...nested];
copy[0] = "rice";         // nested[0] is still "noodles"
copy[1].list = ["flour"]; // nested[1].list is ["flour"] too: shared object

[40, 1, 5, 200].sort();                 // [1, 200, 40, 5]
[40, 1, 5, 200].sort((a, b) => a - b);  // [1, 5, 40, 200]
const sorted = original.sort(cmp);      // sorted === original

Object.groupBy(inventory, ({ type }) => type);
// { vegetables: [...], fruit: [...], meat: [...] }
```

## Traps
- `sort()` with no comparator on numbers.
- `sort()` mutating data you didn't own (props, state, a function argument). Use `toSorted`.
- Chaining on `push`: it returns the new **length**, not the array.
- `reduce` with no initial value on a list that might be empty.
- Thinking `[...arr]` or `structuredClone` are the same: the first is shallow (topic 09).
- Removing items with `splice` inside `forEach`: items get skipped. Use `filter` to build a new array.
- `new Array(3)` gives three **empty slots**, which `map` skips. `Array.from({ length: 3 }, fn)` fills them. (Checked by running: `new Array(3).map(() => 1)` stays empty.)

## Practice questions

**Q1. Predict:** `[1, 30, 4, 21, 100000].sort()`
`[1, 100000, 21, 30, 4]`. Without a comparator, elements are compared as strings.

**Q2. Which array methods mutate? How do you sort without mutating?**
`push`, `pop`, `shift`, `unshift`, `splice`, `reverse`, `sort`, `fill`, `copyWithin`. Use `toSorted()` (or `[...arr].sort()`), and similarly `toReversed`, `toSpliced`, `with`.

**Q3. Is `[...arr]` a deep copy?**
No, shallow. A new array holding the same element references, so nested objects are shared.

**Q4. What does "stable sort" mean, and why does it matter?**
Equal items keep their original order. You can sort by a secondary key, then by the primary key, and ties stay in secondary order. Guaranteed since ES2019.

**Q5. Predict:**
```js
const a = ["e1", "e2", "e3", "e4"];
a.forEach((x, i) => { console.log(x); a.splice(i, 1); });
```
Logs `e1`, `e3`. Removing the current item shifts the rest left, so the next one is skipped. `a` ends as `["e2", "e4"]`.

**Q6. `map` vs `forEach`?**
`map` returns a new array of the callback's results; `forEach` returns `undefined` and is only for side effects. Neither waits for async callbacks.

**Q7. How would you sort bookings by start time, then by client name for equal times?**
One comparator: `(a, b) => a.startMs - b.startMs || a.name.localeCompare(b.name)`. Or two stable sorts: by name first, then by time. (My worked answer, built on MDN's comparator and stability rules.)

**Q8. Why is `Object.groupBy`'s result a null-prototype object?**
So group names can't collide with inherited keys like `toString`. Check membership with `Object.hasOwn` or `in`, not `.hasOwnProperty()` (it doesn't have one).

## Say it (about 40 seconds)
"Arrays are objects with integer indices and a `length` that's tied to them. I know which methods mutate (push, pop, shift, unshift, splice, sort, reverse, fill) and use the copying versions like `toSorted` and `toSpliced` when I don't own the data. All built-in copies are shallow. `sort` compares strings by default, so for numbers I pass `(a, b) => a - b`; it sorts in place, returns the same array, and has been stable since 2019. `some`, `every` and `find` stop early, and `Object.groupBy` or `Map.groupBy` group items by a key."
