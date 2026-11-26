# 06. Object types: optional, readonly, index signatures, excess property checks, tuples

**Sources (typescriptlang.org, read in full):** [Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html)

**Run the checks:** `node interview-prep/modules/02-typescript/examples/run-all.js` (this topic: `examples/06-object-types.ts`)

## Explain

### Optional properties
- `xPos?: number` reads as `number | undefined`. Defaults in destructuring remove the `undefined`: `({ shape, xPos = 0 }: PaintOptions)`.
- **Trap:** you can't annotate inside a destructuring pattern. `({ shape: Shape })` **renames** `shape` to a variable called `Shape`.

### `readonly`
- Compile-time only, and **shallow**: `home.resident.age++` is allowed; `home.resident = …` isn't (2540).
- `readonly` doesn't affect assignability, so a `Person` can be assigned to a `ReadonlyPerson`. Changes made through the writable reference show up through the readonly one (aliasing).
- `-readonly` in a mapped type removes it (topic 07).

### Index signatures
- `[key: string]: number` when you don't know the property names. Allowed key types: `string`, `number`, `symbol`, template string patterns, and unions of these.
- A string index signature forces **every** named property to match (2411 for `name: string` next to `[k: string]: number`). A union index type (`number | string`) fixes it.
- Numeric keys are converted to strings: `obj[0]` is `obj["0"]`. So a number indexer's type must be a subtype of the string indexer's.
- `readonly [i: number]: string` blocks writes.

### Excess property checks
- An **object literal** assigned or passed directly gets checked for unknown properties: `createSquare({ colour: "red" })` → 2561 "did you mean 'color'?".
- The handbook's view: most excess property errors are real bugs.
- Ways around it (use with care):
  1. An assertion: `{ … } as SquareConfig`.
  2. An index signature: `[propName: string]: unknown`.
  3. Assigning to a variable first. This works only if the variable shares **at least one** property with the target; with no overlap, the "weak type" check still fails (2559). The typo is then silently ignored (checked in the example).

### Extending and intersecting
- `interface Circle extends Colorful, Shape {}` or `type ColorfulCircle = Colorful & Circle`. Conflicts behave differently: topic 03.
- Generic object types: `interface Box<T> { contents: T }`. `Array<T>`, `Map<K, V>`, `Set<T>`, `Promise<T>` are the same idea.

### Readonly arrays
- `ReadonlyArray<T>` / `readonly T[]`: no `push` (2339), no constructor.
- A mutable array is assignable to a readonly one, **not the reverse** (4104).
- Still compile-time only: in the example the `push` with `@ts-expect-error` really runs.

### Tuples
- `[string, number]`: known length and a type per position; `pair[2]` → 2493.
- Optional elements at the end (`[number, number, number?]` → `length: 2 | 3`); rest elements anywhere (`[string, ...boolean[], number]`).
- Tuples line up with parameter lists (rest parameters, spreading).
- `as const` on an array gives a **readonly tuple**, which can't be passed where a mutable tuple is expected. The handbook's sample expects error 2345; tsc 7.0.2 reports 4104 ("readonly … cannot be assigned to the mutable type"). The handbook also says `readonly` tuples are a good default, since most tuples are never modified.
- The handbook: prefer objects with named properties when the meaning of each position isn't obvious.

## Worked examples (checked in `examples/06-object-types.ts`)

```ts
interface SquareConfig { color?: string; width?: number }
declare function createSquare(c: SquareConfig): void;

createSquare({ colour: "red", width: 100 });      // error 2561: did you mean 'color'?
const opts = { colour: "red", width: 100 };
createSquare(opts);                                // OK (shares width) — typo ignored!
createSquare({ colour: "red" } as SquareConfig);   // OK — you've told TS to trust you

interface Home { readonly resident: { name: string; age: number } }
home.resident.age++;                               // OK: readonly is shallow
home.resident = { name: "V", age: 42 };            // error 2540
```

## Traps
- Assuming `readonly` freezes anything at runtime. Use `Object.freeze` if you need that (topic 08).
- Silencing an excess property error by moving the literal into a variable: the typo is still there.
- `{ shape: Shape }` in a destructuring pattern.
- Tuples with unclear positions (`[string, number, number]`): use an object.

## Practice questions

**Q1. When does TypeScript complain about an extra property, and when doesn't it?**
Only for a fresh object literal assigned or passed directly to a typed target. Through a variable it's allowed, as long as it has at least one property in common with a weak (all-optional) type.

**Q2. Is `readonly` deep? Does it exist at runtime?**
No and no. It blocks reassigning that property at compile time; nested objects stay mutable, and the JavaScript has no trace of it.

**Q3. Why does `interface D { [k: string]: number; name: string }` fail?**
A string index signature says every string key maps to `number`, and `name` is a string key with a `string` value (2411). Make the index type `number | string`.

**Q4. Mutable array to readonly, and readonly to mutable: which is allowed?**
Mutable → readonly is fine; readonly → mutable is an error (4104), because the receiver could then modify it.

**Q5. What does `[number, number, number?]` mean, and what's its `length` type?**
Two required numbers and an optional third; `length` is `2 | 3`.

## Say it (about 30 seconds)
"Object types have optional and readonly properties, index signatures for unknown keys, and tuples for fixed positions. Two things people get wrong: `readonly` is shallow and compile-time only, and excess property checks only apply to fresh object literals, so moving a literal into a variable hides a typo. With a string index signature, every named property has to fit it. And I use tuples only when the positions are obvious; otherwise an object with names."
