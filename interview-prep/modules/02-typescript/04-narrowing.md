# 04. Narrowing, discriminated unions, `never` exhaustiveness

**Sources (typescriptlang.org, read in full):** [Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

**Run the checks:** `node interview-prep/modules/02-typescript/examples/run-all.js` (this topic: `examples/04-narrowing.ts`)

## Explain

**Narrowing** is TypeScript refining a declared type to a more specific one at a given point in the code. It follows your control flow (`if`/`else`, `switch`, ternaries, early `return`, loops) and recognises **type guards**.

| Guard | Example | Narrows to |
|---|---|---|
| `typeof` | `typeof x === "string"` | the matching primitive. Possible results: `"string"`, `"number"`, `"bigint"`, `"boolean"`, `"symbol"`, `"undefined"`, `"object"`, `"function"` |
| Truthiness | `if (x)` | removes `null`, `undefined` (and the falsy literals) |
| Equality | `x === y`, `x !== null`, `x != null` | the common type; `!= null` removes **both** `null` and `undefined` |
| `in` | `"swim" in animal` | members that have (or may have) that property |
| `instanceof` | `x instanceof Date` | that class (prototype chain check) |
| Assignment | `x = 1` | the assigned type, **within** the declared type |
| Type predicate | `function isFish(p): p is Fish` | whatever the predicate says |
| Assertion function | `function assertDefined(v): asserts v is NonNullable<T>` | narrowed for the rest of the scope, or it throws |
| Discriminant | `shape.kind === "circle"` | the union member with that literal |

### The `typeof null` trap
`typeof null === "object"`, so `typeof strs === "object"` leaves `string[] | null` and iterating is an error (18047). Fix: `strs && typeof strs === "object"`.
Don't fix it by wrapping everything in `if (strs)`: that also skips the empty string `""` (falsy values: `0`, `NaN`, `""`, `0n`, `null`, `undefined`).

### Assignments
Assigning narrows the variable, but what you're **allowed** to assign is still checked against the **declared** type: `let x = cond ? "a" : 1` then `x = true` is an error (2322).

### Type predicates
`pet is Fish` as a return type. `zoo.filter(isFish)` then returns `Fish[]`.
A predicate is a promise TypeScript doesn't verify: a body that always returns `true` compiles (checked in the example).

### Discriminated unions
Give every member a shared literal property (`kind`, `type`, `status`).
- The handbook's "bad" version: one interface with `kind` and optional `radius?`/`sideLength?`. Checking `kind` can't tell TS which fields exist, so you end up with `!`.
- The good version: separate `Circle { kind: "circle"; radius }` and `Square { kind: "square"; sideLength }`. Checking `kind` narrows to the member. The handbook suggests this for network messages and state changes.

### `never` and exhaustiveness
When every case is handled, what's left is `never`. Nothing (except `never`) is assignable to `never`, so:
```ts
default: {
  const exhaustive: never = shape; // compiles only if every kind was handled
  return exhaustive;
}
```
Add `Triangle` to the union and forget a case: error 2322 "Triangle is not assignable to never".

## Worked example (checked in `examples/04-narrowing.ts`)

```ts
type Shape = { kind: "circle"; radius: number } | { kind: "square"; sideLength: number };

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle": return Math.PI * shape.radius ** 2; // shape: circle member
    case "square": return shape.sideLength ** 2;       // shape: square member
    default: { const exhaustive: never = shape; return exhaustive; }
  }
}
```
A booking-flavoured version (my own, for practice): `type PaymentEvent = { type: "succeeded"; amountMinor: number } | { type: "failed"; reason: string } | { type: "refunded"; amountMinor: number }`. Handle each with a `switch` and a `never` default, so a new event type from the provider becomes a compile error.

## Traps
- `typeof x === "object"` includes `null`.
- `if (value)` drops `0` and `""`, which are often valid (a 0 deposit, an empty note).
- `in` with optional properties: the member appears in **both** branches.
- A wrong type predicate silently lies; keep predicates small and test them.
- Discriminated unions need a **literal** discriminant; `kind: string` doesn't narrow.

## Practice questions

**Q1. Name five ways TypeScript narrows a type.**
`typeof`, truthiness, equality (`===`, `!= null`), `in`, `instanceof`, assignment, type predicates, assertion functions, discriminant checks, plus control flow (early return).

**Q2. Why does this fail, and fix it.**
```ts
function printAll(strs: string | string[] | null) {
  if (typeof strs === "object") for (const s of strs) console.log(s);
}
```
`typeof null` is `"object"`, so `strs` can still be `null` (18047). Use `if (strs && typeof strs === "object")`.

**Q3. What's a discriminated union and why is it better than optional fields?**
A union where every member has the same literal property. Checking that property tells TS exactly which member you have and which fields exist, so no `!` or `undefined` checks are needed.

**Q4. How do you make a `switch` fail to compile when someone adds a new case to the union?**
Assign the value to a `never` variable in `default`. Any unhandled member isn't assignable to `never`.

**Q5. `x != null` vs `x !== null`?**
`!= null` removes both `null` and `undefined`; `!== null` only `null`.

**Q6. What's the difference between a type predicate and an assertion function?**
A predicate returns a boolean and narrows inside the `if`. An assertion function returns nothing and throws if the condition is false, so the narrowing applies to everything after the call.

## Say it (about 40 seconds)
"Narrowing is TypeScript following my control flow to refine a union: `typeof`, truthiness, equality, `in`, `instanceof`, and my own type predicates. Two traps: `typeof null` is `'object'`, and truthiness checks drop zero and empty strings. For data with variants, like payment events, I use a discriminated union, every member with a literal `type` field, and switch on it. In the default case I assign to `never`, so adding a new event type is a compile error instead of a silent bug."
