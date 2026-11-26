# 02. Everyday types: primitives, arrays, unions, literals, assertions

**Sources (typescriptlang.org, read in full):** [Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)

**Run the checks:** `node interview-prep/modules/02-typescript/examples/run-all.js` (this topic: `examples/02-everyday-types.ts`)

## Explain

### Primitives and arrays
- `string`, `number`, `boolean` (no separate int or float). Always lowercase: `String`, `Number`, `Boolean` are the wrapper objects (tsc 7: "'string' is a primitive, but 'String' is a wrapper object").
- `bigint` (`100n`) and `symbol` (every `Symbol()` is unique, so comparing two is flagged as "no overlap", 2367).
- Arrays: `number[]` = `Array<number>`. `[number]` is a **tuple** (topic 06).

### `any`
- Turns checking off for that value: you can call it, index it, assign it anywhere. `noImplicitAny` stops it appearing silently (topic 01, topic 10).

### Object types and optional properties
- `{ x: number; y: number }` (`,` or `;` between properties).
- `last?: string` is optional: read it as `string | undefined`, so check it (`obj.last?.toUpperCase()`).

### Union types
- `number | string`: a value that's one of them.
- **You may only do what's valid for every member.** `id.toUpperCase()` fails on `number | string` (2339) until you narrow (`typeof id === "string"`).
- Members' shared methods are fine: `slice` works on `number[] | string`.
- The handbook's way to remember it: a union of *values* has the *intersection* of their known properties.

### Type aliases and interfaces
- `type Point = {...}` names any type; `interface Point {...}` names an object shape. Full comparison in topic 03.
- An alias is just a name: `type UserId = string` still accepts any string (for real separation see branded types in topic 11).

### Literal types
- `const s = "Hello"` has the type `"Hello"`; `let s = "Hello"` is `string` (it can change).
- Unions of literals are how you model fixed options: `type Alignment = "left" | "right" | "center"`. `boolean` is just `true | false`.
- **Object properties widen**: in `const req = { method: "GET" }`, `req.method` is `string`, because properties can be reassigned. Passing it to a `"GET" | "POST"` parameter fails (2345). Fixes from the handbook:
  1. `method: "GET" as "GET"` (or `req.method as "GET"` at the call);
  2. `as const` on the whole object: every property becomes a **readonly** literal.

### Type assertions
- `x as T` (or `<T>x`, not allowed in `.tsx`, and banned by `erasableSyntaxOnly`). Removed at compile time: **no runtime check**.
- Only allowed toward a more specific or less specific type. `"hello" as number` is an error (2352). The escape hatch `as unknown as T` exists, but it's a sign something's wrong.

### `null`, `undefined` and `!`
- With `strictNullChecks` (on), you must narrow before use.
- `x!` removes `null`/`undefined` from the type. It does nothing at runtime: if you were wrong, it crashes (checked in the example).

### Enums
- The handbook: enums are **not** a type-level addition; they **generate runtime code**. Its advice is to hold off unless you're sure.
- In this repo they're banned outright (`erasableSyntaxOnly`), because Node can't strip them. Use a union of literals, or `as const` objects (topic 12).

## Worked examples (checked in `examples/02-everyday-types.ts`)

```ts
declare function handleRequest(url: string, method: "GET" | "POST"): void;

const req = { url: "https://example.com", method: "GET" };
handleRequest(req.url, req.method);   // error 2345: string isn't "GET" | "POST"

const req2 = { url: "https://example.com", method: "GET" } as const;
handleRequest(req2.url, req2.method); // OK
req2.method = "POST";                 // error 2540: readonly

function liveLength(s: string | null) { return s!.length; }
liveLength(null);                     // compiles, then TypeError at runtime
```

## Traps
- `String` vs `string` in an annotation.
- Using `!` to silence a "possibly undefined" error instead of handling the case.
- Expecting `as` to convert: `JSON.parse('{"id":1}') as { id: string }` leaves `id` a number.
- Forgetting that object properties widen; reaching for `as const` is usually the clean fix.

## Practice questions

**Q1. Why does `id.toUpperCase()` fail on `number | string`, and how do you fix it?**
On a union you can only use what every member has; numbers have no `toUpperCase`. Narrow first: `if (typeof id === "string")`.

**Q2. What does `as const` do?**
Infers the narrowest types: literal types instead of `string`/`number`, readonly properties, and readonly tuples for arrays.

**Q3. Difference between `x as Foo` and `x!`?**
Both are compile-time only. `as` changes the type to a related type; `!` only removes `null` and `undefined`. Neither checks anything at runtime.

**Q4. Why does the handbook say to avoid enums, and what do you use instead?**
They add runtime code (not just types). I use a union of string literals, e.g. `"pending" | "confirmed" | "cancelled"`, which also works with Node type stripping.

**Q5. Predict:** `let a = "x"; const b = "x";` What are the types?
`a: string`, `b: "x"`.

## Say it (about 30 seconds)
"Everyday types are the primitives in lowercase, arrays, object types with optional properties, unions and literal types. On a union you can only use what every member supports, so you narrow first. Literal unions like `'pending' | 'confirmed'` replace enums for me; enums generate runtime code. Object properties widen to `string`, so `as const` is the usual fix. And assertions, `as` or `!`, are promises to the compiler, not runtime checks."
