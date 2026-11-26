# 05. Functions and generics

**Sources (typescriptlang.org, read in full):**
- [More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html)
- [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)

**Run the checks:** `node interview-prep/modules/02-typescript/examples/run-all.js` (this topic: `examples/05-functions-generics.ts`)

## Explain

### Describing functions
- **Function type expression:** `(a: string) => void`. The parameter **name is required**: `(string) => void` means a parameter named `string` of type `any`.
- **Call signature** (a function that also has properties): `type Fn = { description: string; (arg: number): boolean }`. Note `:` not `=>`.
- **Construct signature:** `{ new (s: string): Thing }`, or `new () => T`.

### Generics
- A type parameter **relates** inputs to outputs: `firstElement<T>(arr: T[]): T | undefined`. `any` would lose that link.
- Usually **inferred** from the arguments; you can pass it explicitly: `combine<string | number>([1], ["a"])` when inference picks too narrow a type (error 2322 otherwise).
- **Constraints:** `<T extends { length: number }>` lets you use `.length`. `longest(10, 100)` is then an error (2345).
- **The classic mistake** (from the handbook): returning `{ length: minimum }` from a function declared to return `T`. That object matches the constraint, but **not** the caller's `T` (2322). If it compiled, `minimumLength([1, 2, 3], 6).slice()` would crash; the example shows that crash.
- **Constrained by another parameter:** `getProperty<T, K extends keyof T>(obj: T, key: K): T[K]`.
- **Defaults:** `<T extends HTMLElement = HTMLDivElement>`. Rules: a parameter with a default is optional; required ones can't follow optional ones; the default must satisfy the constraint.
- **Generic classes:** only the instance side is generic; static members can't use the class's type parameter.

### The handbook's three guidelines for good generics
1. **Push type parameters down:** `arr: T[]` beats `T extends unknown[]` (the second infers through the constraint and gets less precise).
2. **Use as few type parameters as possible.**
3. **A type parameter should appear at least twice.** If it only appears once, it isn't relating anything: use the plain type.

### Variance (Generics page)
- Covariance: a `Producer<Cat>` can be used as a `Producer<Animal>`. Contravariance: a `Consumer<Animal>` can be used as a `Consumer<Cat>`.
- TypeScript works this out from the structure. `in`/`out` annotations exist for rare circular cases; the handbook says never write ones that don't match the structure.

### Optional parameters and callbacks
- `x?: number` gives `number | undefined`; `x = 10` gives `number`.
- **Rule for callbacks:** don't make a callback parameter optional unless *you* will call it without that argument. `(arg, index?) => void` forces every caller to handle `undefined` (18048).
- A callback with **fewer** parameters is always fine: `arr.map((s) => s.length)` ignores the index.

### Overloads
- Several **overload signatures**, then one **implementation signature** that's compatible with all of them (2394 if not).
- The implementation signature **isn't callable from outside**: with overloads for 1 and 3 arguments, `makeDate(1, 3)` fails (2575).
- A call resolves to **one** overload, so a `string | unknown[]` argument fits neither `len(s: string)` nor `len(arr: unknown[])` (2769).
- The handbook: **always prefer union-typed parameters to overloads when possible.**

### `this`, `void`, `object`, `unknown`, `never`, `Function`
- Declare `this` as a fake first parameter: `function (this: User) {}` (erased at runtime; arrows can't do it).
- `void` vs others: topic 10. One rule here: a function **typed contextually** as `() => void` may return a value (it's ignored), which is why `src.forEach((el) => dst.push(el))` compiles. A function **declared** `(): void` can't return one (2322).

### Rest parameters and spread
- `...m: number[]`. Spreading an array into fixed parameters needs a tuple: `const args = [8, 5]` is `number[]` (2556 for `Math.atan2(...args)`); `as const` makes it `readonly [8, 5]`.

## Worked examples (checked in `examples/05-functions-generics.ts`)

```ts
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] { return obj[key]; }
getProperty({ a: 1, b: 2 }, "a"); // number
getProperty({ a: 1, b: 2 }, "m"); // error 2345

function len(s: string): number;
function len(arr: unknown[]): number;
function len(x: string | unknown[]) { return x.length; }
len(Math.random() > 0.5 ? "hi" : [0]); // error 2769: no single overload fits
function lenUnion(x: unknown[] | string) { return x.length; } // just use a union
```

## Traps
- Writing `(string) => void`.
- Returning "something compatible with the constraint" from a generic function.
- A type parameter used once (`<T>(x: T): void`): pointless.
- Optional callback parameters.
- Overloads where a union would do; and forgetting the implementation signature is invisible.

## Practice questions

**Q1. Why use a generic instead of `any`?**
A generic keeps the link between input and output types: `firstElement(["a"])` returns `string | undefined`. `any` throws that away.

**Q2. Fix this so it compiles honestly:** `function minimumLength<T extends { length: number }>(obj: T, min: number): T { … return { length: min }; }`
You can't return a new object as `T`. Either return a value of the caller's type (for example `obj`) or change the return type to `{ length: number }`.

**Q3. What do `extends` and `keyof` do in `<T, K extends keyof T>`?**
`K` must be one of `T`'s keys, so `obj[key]` is valid and the return type `T[K]` is that property's type.

**Q4. When are overloads the right tool?**
When the return type depends on which parameter shape was passed and a union or a generic can't express it. The handbook says prefer unions when possible; conditional types (topic 07) can also replace overloads.

**Q5. Why does `arr.forEach((x) => out.push(x))` compile when `forEach` wants a `void` callback?**
A contextually typed `() => void` function may return a value; it's just ignored.

**Q6. What's wrong with `callback: (item: T, index?: number) => void`?**
The caller's callback has to treat `index` as possibly `undefined`. Make it required: a callback can always ignore extra arguments.

## Say it (about 40 seconds)
"Generics let a function keep the relationship between its inputs and outputs, like `firstElement<T>(arr: T[]): T`, instead of losing it with `any`. Constraints, `T extends { length: number }`, say what I need from `T`, and `K extends keyof T` lets me type a safe property lookup. I follow the handbook's rules: push type parameters down, use as few as possible, and each should appear at least twice. For different call shapes I prefer a union parameter over overloads, because a call can only match one overload."
