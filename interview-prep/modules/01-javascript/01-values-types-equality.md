# 01. Values, types, coercion and equality

**Sources (MDN, read in full, snapshot of 25 Nov 2026):**
- [JavaScript data types and data structures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Data_structures)
- [Equality comparisons and sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness)

**Run the checks:** `node interview-prep/modules/01-javascript/examples/01-values-equality.js`

## Explain

**Typing**
- JavaScript is **dynamic**: any variable can hold any type, and the type can change.
- It's also **weak**: operators convert types for you (implicit coercion). `42 + "1"` is `"421"`.

**The 7 primitives:** `null`, `undefined`, `boolean`, `number`, `bigint`, `string`, `symbol`.
- Primitives are **immutable**. String methods return new strings.
- Everything else is an **object**, and objects are the only mutable values. Functions are callable objects.
- `typeof null` is `"object"`, so MDN says to test for null with `=== null`.

**`undefined` vs `null`**
- `undefined` means "no value": a missing property, a `let x;` with nothing assigned, a function with no `return`.
- `null` means "no object". It's also where every prototype chain ends.

**Numbers**
- Every `number` is an IEEE 754 double. `0.1 + 0.2 !== 0.3`.
- Integers are only exact up to ±(2^53 − 1), `Number.MAX_SAFE_INTEGER`. Past that, neighbouring integers collide.
- There's a `+0` and a `-0`: `42 / -0` is `-Infinity`.
- `NaN` is the only value that isn't equal to itself.
- `BigInt` (`10n`) has no size limit, but you can't mix it with numbers in maths (TypeError).

**Strings**
- Strings are UTF-16. `length` counts code units, so one emoji can have length 2.

**Object keys** are always strings or symbols. A number key is turned into a string.

**Coercion to a primitive** (MDN's three paths)
- Default: `[Symbol.toPrimitive]("default")`, then `valueOf()`, then `toString()`.
- Numeric: the same with the "number" hint.
- String: `toString()` is tried before `valueOf()`.
- That's why `[] + {}` is `"[object Object]"`: both become strings and get concatenated.

**Four equality algorithms**

| Algorithm | Used by | `NaN` vs `NaN` | `+0` vs `-0` | Converts types? |
|---|---|---|---|---|
| `===` (strict) | `===`, `indexOf`, `lastIndexOf`, `switch` | not equal | equal | no |
| `==` (loose) | `==` | not equal | equal | yes |
| SameValue | `Object.is()` | **equal** | **not equal** | no |
| SameValueZero | `includes`, `Map` keys, `Set` values | **equal** | equal | no |

- None of them compares structure. Two different objects with the same contents are never equal. There's no built-in deep equality.
- MDN's advice: use `===`, and `Number.isNaN()` to test for NaN.

**How `==` converts** (MDN's summary)
1. Same type: compare like `===`.
2. `null` and `undefined` are equal to each other and to nothing else.
3. Object vs primitive: the object is turned into a primitive.
4. Boolean vs anything: the boolean becomes a number.
5. String vs number: the string becomes a number.

## Worked examples (all checked in the example file)

```js
typeof null;            // "object"
42 + "1";               // "421"   (+ with a string concatenates)
"6" * "2";              // 12      (other maths operators convert to number)
[] + {};                // "[object Object]"
[1, 2] + [3];           // "1,23"
0.1 + 0.2 === 0.3;      // false
2 ** 53 === 2 ** 53 + 1; // true   (past the safe range)
1n + 1;                 // TypeError
1n == 1;                // true
1n === 1;               // false
"😀".length;            // 2

[NaN].indexOf(NaN);     // -1      (=== can't find NaN)
[NaN].includes(NaN);    // true    (SameValueZero can)
Object.is(+0, -0);      // false
0 == false;             // true
"" == 0;                // true
[1, 2] == "1,2";        // true
null == undefined;      // true
null == false;          // false   (null only loosely equals undefined)
null == 0;              // false
```

## Traps
- `typeof null === "object"`. Use `x === null`.
- `{} + []` typed at the start of a console line gives `0`, not `"[object Object]"`. The `{}` is read as an empty block, leaving `+[]`. (Checked by running it with `eval`; inside an expression it gives `"[object Object]"`.)
- `indexOf` can't find `NaN`; `includes` can.
- Money in floats: `0.1 + 0.2` isn't `0.3`. Store money as integer cents. (This is the repo's production rule, not an MDN statement.)
- In a module (always strict), writing `str[0] = "H"` throws a TypeError. In old sloppy code it silently does nothing.

## Practice questions

**Q1. What's the difference between `null` and `undefined`?**
`undefined` is "no value yet": an unassigned variable, a missing property, a function that doesn't return. `null` is a deliberate "no object", and it's what ends the prototype chain. `null == undefined` is true but `null === undefined` is false.

**Q2. How do you check a value is null? Why not `typeof`?**
`typeof null` returns `"object"`, the same as for real objects, so it can't tell them apart. Use `x === null`. (The history of why is on MDN's `typeof` page, which this module didn't cover.)

**Q3. `==` vs `===`?**
`===` never converts types. `==` converts first (null/undefined only match each other; objects become primitives; booleans become numbers; strings become numbers when compared with numbers). Use `===` by default.

**Q4. Predict: `[NaN].includes(NaN)` and `[NaN].indexOf(NaN)`.**
`true` and `-1`. `includes` uses SameValueZero, `indexOf` uses `===`.

**Q5. How do you check two objects have the same contents?**
None of the built-in equality operators do that: they compare identity. You compare the fields you care about yourself, or use a deep-equal helper (for example `assert.deepStrictEqual` in Node tests).

**Q6. Why not store prices as floats?**
Numbers are doubles, so many decimal fractions can't be represented exactly (`0.1 + 0.2`). Integer cents are exact up to 2^53 − 1.

**Q7. What does `Object.is` do differently from `===`?**
Two cases only: `Object.is(NaN, NaN)` is true and `Object.is(+0, -0)` is false.

## Say it (about 30 seconds)
"JavaScript has seven primitive types, which are immutable, and everything else is an object. It's dynamically and weakly typed, so operators coerce: plus with a string concatenates, other maths operators convert to numbers. For equality I use triple-equals, which never converts. Loose equality converts first, which gives surprises like empty string equals zero. `includes`, Map and Set use SameValueZero, so they can find NaN, and `Object.is` is the only one that separates plus and minus zero. None of them compares object contents."
