# 10. ★ `any` vs `unknown` vs `never` vs `void` (and `object`, `{}`, `Function`)

`unknown` vs `any` was asked in the micro1 Backend interview (19 Nov 2026). Replaces old guide T3.

**Sources (typescriptlang.org, read in full):**
- [More on Functions: "Other Types to Know About"](https://www.typescriptlang.org/docs/handbook/2/functions.html#other-types-to-know-about)
- [Everyday Types: `any`](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any)
- [Type Compatibility: the assignability table](https://www.typescriptlang.org/docs/handbook/type-compatibility.html#any-unknown-object-void-undefined-null-and-never-assignability)

**Run the checks:** `node interview-prep/modules/02-typescript/examples/run-all.js` (this topic: `examples/10-unknown-any-never-void.ts`)

## Explain

| Type | Means | You can… |
|---|---|---|
| `any` | "don't check this" | do anything with it; assign it anywhere. Errors move to runtime |
| `unknown` | "some value, I don't know what yet" | assign anything **to** it; do **nothing** with it until you narrow (18046) |
| `never` | "no value can be here" | assign it to anything; assign nothing (except `never`) to it |
| `void` | "the return value isn't meant to be used" | not test it for truthiness (1345); `undefined` is assignable to it |
| `object` | any **non-primitive** (objects, arrays, functions) | not pass `42` (2345). The handbook: always use `object`, not `Object` |
| `{}` | any value except `null`/`undefined` | (checked: `const b: {} = 42` compiles) |
| `Function` | any function; calling it returns `any` | avoid; use `() => void` if you only need "a function I'll call" |

### `any` vs `unknown`
- Both accept every value. The difference is what you can do **afterwards**.
- `any` spreads: `const s: string = anyValue.whatever` compiles and is `undefined` at runtime.
- `unknown` is the safe type for data from outside: `JSON.parse` results, request bodies, `catch` errors (topic 01), message payloads. The handbook's example: `function safeParse(s: string): unknown`.
- Narrow with `typeof`, `instanceof`, `in`, a type predicate (topic 04), or a schema library. The example validates money as an integer number of minor units plus a currency string, and rejects floats.

### `never`
- The return type of a function that always throws (`fail(): never`) or never finishes.
- What's left in a union after every case is handled: the exhaustiveness check (topic 04).
- The assignability table: `never` is assignable to everything, nothing is assignable to `never`. `unknown` is the exact opposite (everything goes in, nothing comes out). The handbook calls them inverses.

### `void`
- What a function returns when it has no `return`. **Not the same as `undefined`** (the handbook is explicit).
- Contextual `() => void` callbacks may return values (topic 05).

### Assignability table (Type Compatibility page, with `strictNullChecks` on)
- Everything → `unknown`. `unknown` → only `unknown` and `any`.
- `any` → everything except `never`.
- `never` → everything.
- `null`/`undefined` → only `any`, `unknown` (and `undefined` → `void`).

## Worked example (checked in `examples/10-unknown-any-never-void.ts`)

```ts
interface Money { amountMinor: number; currency: string }

function isMoney(v: unknown): v is Money {
  return (
    typeof v === "object" && v !== null &&
    "amountMinor" in v && Number.isInteger(v.amountMinor) &&  // `in` narrowed v
    "currency" in v && typeof v.currency === "string"
  );
}

const data: unknown = JSON.parse('{"amountMinor": 2500, "currency": "GBP"}');
data.amountMinor;                    // error 18046: 'data' is of type 'unknown'
if (isMoney(data)) data.amountMinor; // 2500, typed
isMoney({ amountMinor: 25.5, currency: "GBP" }); // false: floats rejected
```
The check ensures money arrives as integer minor units (one of this repo's production rules).

## Traps
- Using `any` "temporarily" for API responses. It silently spreads into typed code.
- `as Money` on parsed JSON (no check) instead of narrowing from `unknown`.
- Treating `void` as `undefined`.
- Using `{}` or `Object` to mean "an object": `{}` accepts `42`.

## Practice questions

**Q1. `any` vs `unknown`?**
Both accept anything. `any` turns checking off, so mistakes reach runtime and it leaks into typed code. `unknown` makes you narrow before use, so it's the safe type for outside data.

**Q2. Where do you get `unknown` without writing it?** `catch (err)` with `useUnknownInCatchVariables` (part of `strict`). And your own boundaries: the handbook types `safeParse` as returning `unknown`.

**Q3. What's `never` used for?** Functions that never return, and "no cases left" in narrowing, which makes the exhaustiveness check possible.

**Q4. Is `void` the same as `undefined`?** No. `void` means the result shouldn't be used; TS won't let you test it for truthiness, and a `() => void` callback may still return something.

**Q5. `object` vs `{}` vs `Object`?** `object` is any non-primitive. `{}` is any value except `null`/`undefined`. The handbook says always use `object`, not `Object`.

**Q6. How would you type and validate a webhook body?** Type it `unknown` at the boundary, validate with a predicate or schema, and only then treat it as the event type. Never `as`.

## Say it (about 35 seconds)
"`any` switches type checking off, so errors reach runtime and it spreads into typed code. `unknown` also accepts anything, but I have to narrow it before I can use it, so it's what I use for anything from outside: request bodies, webhook payloads, caught errors. I validate at the boundary, for example that an amount is an integer in minor units, and then it's a real type. `never` means no value is possible, which is what makes exhaustive switches work, and `void` means a return value isn't meant to be used; it's not the same as `undefined`."
