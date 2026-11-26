# 11. Structural typing and type compatibility

**Sources (typescriptlang.org, read in full):**
- [Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
- [Classes: "Relationships Between Classes"](https://www.typescriptlang.org/docs/handbook/2/classes.html#relationships-between-classes)
- [tsconfig: `strictFunctionTypes`](https://www.typescriptlang.org/tsconfig/#strictFunctionTypes)
- [Understanding Errors](https://www.typescriptlang.org/docs/handbook/2/understanding-errors.html)

**Run the checks:** `node interview-prep/modules/02-typescript/examples/run-all.js` (this topic: `examples/11-compatibility.ts`)

## Explain

### Structural, not nominal
- TypeScript compares **shapes**. A `Dog` class with `name` is assignable to a `Pet` interface without ever mentioning `Pet`. (C# and Java are nominal: the declared names must match.)
- The rule: `x` is compatible with `y` if `y` has **at least** the members `x` requires (extra members are fine), checked recursively.
- Fresh object literals are the exception: excess property checks (topic 06).
- The handbook says TypeScript is deliberately **not fully sound** in a few places; it lists them.

### Functions
- **Parameters:** a function with **fewer** parameters is assignable to one with more (it ignores the extras, like `forEach` callbacks). The reverse is an error.
- **Return types:** the source must return at least what the target promises.
- **Parameter bivariance:** without `strictFunctionTypes`, parameter types are accepted in both directions. The handbook calls this unsound but allowed. `strictFunctionTypes` (part of `strict`) checks parameters **contravariantly**, but **only for function-type syntax**. Method syntax (`handle(a: Animal): void` in an interface) stays bivariant. The example shows a Cat-only handler accepted through method syntax and then crashing on a plain Animal.
- Optional and required parameters are interchangeable; a rest parameter counts as infinite optional ones. With overloads, every target overload must be matched.

### Classes
- Only **instance** members are compared; constructors and statics are ignored. `Animal1 { feet }` and `Size { feet }` are interchangeable.
- `private` and `protected` members must come from the **same declaration**, so classes with them behave nominally (2322 in the example).
- An empty class is compatible with almost anything; don't write one as a parameter type (the Classes page).

### Generics
- A type parameter only matters where it's **used**: `Empty<number>` and `Empty<string>` are the same type; `NotEmpty<T> { data: T }` versions aren't.
- Unspecified type arguments become `any`.

### "Assignable to" in error messages
- "X is not assignable to Y" means X can't be used where Y is expected. It's directional.
- The extra indented lines (**error elaboration**) explain why, one step at a time (which property, then which nested type). (My habit, not from the page: read them to the last line to find the real mismatch.)

### Branded types (a community pattern, not from the handbook)
Because typing is structural, `type BookingId = string` accepts any string. A brand adds a fake property that only your constructor function provides: `type BookingId = string & { readonly __brand: "BookingId" }`. Then a `ClientId` can't be passed where a `BookingId` is needed (2345 in the example). It's compile-time only.

## Worked example (checked in `examples/11-compatibility.ts`)

```ts
let x = (a: number) => 0;
let y = (b: number, s: string) => 0;
y = x;   // OK: x ignores the extra argument
x = y;   // error 2322: callers of x won't pass the string y needs

type FnHandler = (a: Animal) => void;            // function syntax
interface MethodHandler { handle(a: Animal): void } // method syntax
const catOnly = (c: Cat) => c.meow();
const h1: FnHandler = catOnly;                   // error 2322 (strictFunctionTypes)
const h2: MethodHandler = { handle: catOnly };   // allowed (bivariant) — and unsafe
```

## Traps
- Expecting two differently named but identical types to be incompatible.
- Expecting `strictFunctionTypes` to cover methods.
- Using an alias like `type UserId = string` as if it prevented mix-ups.
- Reading only the first line of a long error.

## Practice questions

**Q1. What does "structural typing" mean? Give a consequence.**
Compatibility is decided by shape, not by declared names. A class never declared to implement an interface can still be passed where it's expected, and two identical classes are interchangeable.

**Q2. Why can you pass `(x) => …` with one parameter where a two-parameter callback is expected?** Extra arguments are ignored in JavaScript, so a function needing fewer parameters is safe to call with more.

**Q3. What does `strictFunctionTypes` do, and what doesn't it cover?** Checks function parameters contravariantly for function-type syntax. Method-syntax members stay bivariant.

**Q4. When do classes stop being purely structural?** When they have `private` or `protected` members: those must come from the same declaration.

**Q5. How do you stop a `ClientId` string being passed as a `BookingId`?** A branded type (compile-time) or a wrapper object; plain aliases don't help.

## Say it (about 30 seconds)
"TypeScript is structurally typed: if a value has at least the members a type needs, it fits, whatever it's called. Functions with fewer parameters fit where more are passed, and return types must provide at least what's promised. `strictFunctionTypes` checks parameters properly, but only for function-type syntax, not methods. Classes with private members behave nominally. And when I need two string IDs not to mix, I use a branded type, because a plain alias doesn't stop it."
