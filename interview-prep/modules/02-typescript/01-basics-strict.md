# 01. What TypeScript does: static checking, inference, erasure, `strict`

**Sources (typescriptlang.org, read in full):**
- [The Basics](https://www.typescriptlang.org/docs/handbook/2/basic-types.html)
- [tsconfig: `strict`](https://www.typescriptlang.org/tsconfig/#strict) and the flags it turns on ([`noImplicitAny`](https://www.typescriptlang.org/tsconfig/#noImplicitAny), [`strictNullChecks`](https://www.typescriptlang.org/tsconfig/#strictNullChecks), [`useUnknownInCatchVariables`](https://www.typescriptlang.org/tsconfig/#useUnknownInCatchVariables)), plus [`noUncheckedIndexedAccess`](https://www.typescriptlang.org/tsconfig/#noUncheckedIndexedAccess) and [`exactOptionalPropertyTypes`](https://www.typescriptlang.org/tsconfig/#exactOptionalPropertyTypes)
- [TypeScript 6.0 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html) (for the current defaults)

**Run the checks:** `node interview-prep/modules/02-typescript/examples/run-all.js` (this topic: `examples/01-basics-strict.ts`)

## Explain

### What TypeScript is
- JavaScript only finds out what a value can do **by running the code**. TypeScript is a **static type checker**: it predicts, before running, which operations will fail.
- A type describes which values can be passed to a function (or used in an operation) without crashing.
- It flags code that is valid JavaScript but almost certainly a bug, even when it wouldn't throw:
  - reading a property that doesn't exist (`user.location`, error 2339);
  - a typo (`toLocaleLowercase`, 2551 "did you mean…");
  - an uncalled function (`Math.random < 0.5`, 2365);
  - a comparison that can never be true (2367).
- The same checker powers the editor: completions, quick fixes, refactors and go-to-definition.

### Inference
- `let msg = "hello there!"` is inferred as `string`. The handbook's advice: don't annotate when inference already gives the same type.
- **Function parameters** usually need annotations: they're what callers' arguments are checked against. Callbacks are the exception: their parameters are inferred from where they're passed ("contextual typing", e.g. `names.forEach((s) => …)`). Return types are optional: the Everyday Types page says people add them as documentation or to prevent accidental changes.

### Erasure: types don't exist at runtime
- The handbook says it plainly: type annotations **never change the runtime behaviour** of your program. They're removed when compiled.
- So a type annotation or assertion (`x as Booking`) is not a check. Data from outside (JSON, a request body) is whatever it is, so validate it at runtime (topic 10).
- In this repo, Node runs `.ts` files by **replacing the types with spaces** (topic 12). There's no compile step at all, and no type checking: `tsc` does that.
- By default `tsc` **still emits JavaScript even when there are type errors** (you may know better than the checker). `noEmitOnError` stops that.

### `strict`
- `strict: true` turns on the whole "strict mode family". The tsconfig docs warn that future versions may add more checks under it, so upgrading can bring new errors.
- **Since TypeScript 6.0, `strict` is on by default** (the Basics page still says the default is lenient; the 6.0 release notes changed it). `examples/12-modules-tooling.ts` proves it with tsc 7.0.2: an empty `tsconfig.json` still reports an implicit `any`.
- The flags that matter most:

| Flag | What it does | Error you'll see |
|---|---|---|
| `noImplicitAny` | A parameter with no type and no context is an error, not silently `any` | 7006 |
| `strictNullChecks` | `null`/`undefined` aren't assignable to other types; `find()` returns `T \| undefined` | 18048 "possibly undefined" |
| `strictFunctionTypes` | Function parameters are checked properly (topic 11) | 2322 |
| `strictPropertyInitialization` | Class fields must be set in the constructor (topic 09) | 2564 |
| `useUnknownInCatchVariables` | `catch (err)` gives `err: unknown`, because anything can be thrown | 18046 |
| `strictBindCallApply`, `noImplicitThis` | Typed `call`/`apply`/`bind`; error on implicit `this: any` | 2345, 2683 |

- Two stricter flags **this repo also turns on** (not part of `strict`):
  - `noUncheckedIndexedAccess`: `arr[2]` and `env["NODE_ENV"]` are `T | undefined`. Index signatures are the case the docs describe; I checked arrays by running tsc.
  - `exactOptionalPropertyTypes`: `theme?: "dark"` means "may be missing", not "may be set to `undefined`". The docs' reason: `"theme" in obj` is true after `obj.theme = undefined`.

## Worked examples (all checked in `examples/01-basics-strict.ts`)

```ts
const users = [{ name: "Ana", age: 30 }];
const found = users.find((u) => u.name === "Ben"); // { name; age } | undefined
found.age;            // error 18048: 'found' is possibly 'undefined'
found?.age;           // OK: undefined

try { throw "a string"; }
catch (err) {          // err: unknown
  err.message;         // error 18046
  const text = err instanceof Error ? err.message : String(err); // narrow first
}

const slots = ["09:00", "10:00"];
const third = slots[2];   // string | undefined (noUncheckedIndexedAccess)
third ?? "none";          // "none"

const n = 5 as unknown as string;
typeof n;                 // "number": an assertion changes nothing at runtime
```

## Traps
- Thinking an annotation or `as` validates data. It doesn't; nothing about types survives to runtime.
- Turning off `strict` to "get it compiling". Most `strictNullChecks` errors are real `undefined` bugs.
- Expecting `tsc` to stop output on errors. It doesn't unless `noEmitOnError` is set.
- Reading handbook pages for **defaults**: several describe pre-6.0 defaults (lenient strictness, ES5 target). Check the 6.0/7.0 notes (topic 12).

## Practice questions

**Q1. What does TypeScript add to JavaScript, and what doesn't it change?**
A static type checker and editor tooling, before the code runs. It doesn't change what the code does at runtime: types are erased.

**Q2. Your teammate writes `const body = req.body as Booking`. Is that safe?**
No. `as` only tells the checker to trust you. At runtime `body` is whatever was sent. Validate it (narrow from `unknown`, or a schema library) and then you have a real `Booking`.

**Q3. What does `strictNullChecks` change? Give an error it catches.**
`null` and `undefined` become their own types, not assignable to everything. `users.find(...)` returns `User | undefined`, so `found.age` is flagged until you check it.

**Q4. Why is `err` `unknown` in a `catch`?**
JavaScript can throw anything (a string, a number, `undefined`), so the checker can't promise an `Error`. You narrow with `instanceof Error` first.

**Q5. What does `noUncheckedIndexedAccess` add, and why does this repo turn it on?**
Reading by index (`arr[i]`, `record[key]`) includes `undefined` in the type, so out-of-range reads and missing keys must be handled. It catches a common runtime `undefined` bug. The cost is more checks in loops where you know the index is valid.

**Q6. Is `strict` on by default?**
Since TypeScript 6.0, yes (6.0 release notes; checked with tsc 7.0.2). Older docs and many tutorials say it's off.

## Say it (about 40 seconds)
"TypeScript is a static type checker for JavaScript. It predicts, before the code runs, which operations will fail: missing properties, typos, possibly-undefined values. Types are erased, so they never change runtime behaviour; that's why an `as` cast isn't validation and I check outside data at runtime. I always use `strict`, which is the default since TypeScript 6, and in my own projects I add `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, because most of the bugs they flag are real `undefined` bugs."
