# 07. Types from types: `keyof`, `typeof`, indexed access, conditional, mapped, template literal

**Sources (typescriptlang.org, read in full):**
[Creating Types from Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html) ·
[`keyof`](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html) ·
[`typeof`](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html) ·
[Indexed Access Types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html) ·
[Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html) ·
[Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html) ·
[Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)

**Run the checks:** `node interview-prep/modules/02-typescript/examples/run-all.js` (this topic: `examples/07-type-manipulation.ts`)

**How the example checks types:** `Expect<Equal<A, B>>` only compiles when `A` and `B` are the same type. That helper is a widely used community pattern, **not** something from the handbook; the file includes a deliberate failing case to prove it isn't checking nothing.

## Explain

### `keyof`
`keyof Point` → `"x" | "y"`. With a number index signature → `number`; with a **string** index signature → `string | number` (because `obj[0]` is the same as `obj["0"]`).

### `typeof` in a type position
- `let n: typeof s` copies the type of a **value**.
- Its main use: `ReturnType<typeof f>`. `ReturnType<f>` is an error (2749): `f` is a value, not a type.
- Only allowed on identifiers and their properties, not on calls.

### Indexed access
- `Person["age"]` → `number`; `Person["age" | "name"]`; `Person[keyof Person]` → union of all property types.
- `(typeof MyArray)[number]` → the element type of an array.
- The index must be a **type**: `const key = "age"; Person[key]` fails (2749); `type key = "age"` works.

### Conditional types
- `T extends U ? X : Y`: "if `T` is assignable to `U`".
- Their power is with generics. The handbook's `NameOrId<T>` replaces three overloads (overloads multiply as cases grow).
- Inside the true branch, `T` is known to match: `T extends { message: unknown } ? T["message"] : never`.
- **`infer`** pulls a type out: `T extends Array<infer Item> ? Item : T`; `T extends (...args: never[]) => infer R ? R : never`.
  - With overloaded functions, inference uses the **last** signature.
- **Distributive:** on a naked type parameter, a conditional runs per union member: `ToArray<string | number>` → `string[] | number[]`. Wrap both sides in brackets to stop it: `[T] extends [unknown]` → `(string | number)[]`.

### Mapped types
- `{ [K in keyof T]: boolean }`: build a type by looping over keys.
- Modifiers: add or remove `readonly` and `?` with `+`/`-`: `-readonly` (mutable), `-?` (all required).
- **Key remapping with `as`** (TS 4.1+): `` [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] ``. Map a key to `never` to **drop** it: `as Exclude<K, "kind">`.
- They can loop over any union, not just `keyof`, and combine with conditional types.

### Template literal types
- `` `${EmailIDs | FooterIDs}_id` ``. Unions in placeholders **cross-multiply** (2 × 2 = 4 strings). The handbook recommends generating very large unions ahead of time instead.
- The `on("firstNameChanged", cb)` example: `` on<K extends string & keyof T>(eventName: `${K}Changed`, cb: (v: T[K]) => void) `` infers `K` from the string, so the callback gets the right value type and typos are rejected.
- Built-in string manipulation types: `Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize`.

## Worked examples (checked in `examples/07-type-manipulation.ts`)

```ts
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
type LazyPerson = Getters<{ name: string; age: number }>;
// { getName: () => string; getAge: () => number }

type ToArray<T> = T extends unknown ? T[] : never;
type A = ToArray<string | number>;        // string[] | number[]  (distributive)
type ToArrayND<T> = [T] extends [unknown] ? T[] : never;
type B = ToArrayND<string | number>;      // (string | number)[]

const person = makeWatchedObject({ firstName: "Sam", age: 26 });
person.on("ageChanged", (newAge) => newAge.toFixed()); // newAge: number
person.on("firstName", () => {});                       // error 2345
```

## Traps
- `ReturnType<f>` instead of `ReturnType<typeof f>`.
- Indexing a type with a `const` value instead of a type.
- Surprise distribution over a union in a conditional type.
- `Capitalize<K>` where `K` may be a number or symbol key: intersect with `string` (`string & K`).
- Building huge template-literal unions.

## Practice questions

**Q1. What's `keyof { [k: string]: boolean }`, and why?**
`string | number`: numeric keys are converted to strings in JavaScript, so number keys are valid too.

**Q2. Write a type for "the element type of this array constant".**
`(typeof MyArray)[number]`.

**Q3. What does `infer` do? Write `ReturnType` yourself.**
It declares a type variable to capture inside a conditional: `type MyReturn<T> = T extends (...args: never[]) => infer R ? R : never`.

**Q4. Why is `ToArray<string | number>` `string[] | number[]` and not `(string | number)[]`?**
Conditional types on a naked type parameter distribute over unions. Wrap in `[T] extends [unknown]` to stop it.

**Q5. Write a mapped type that makes every property optional and readonly.**
`type RO<T> = { readonly [K in keyof T]?: T[K] }` (this is `Readonly<Partial<T>>`).

**Q6. How would you drop the `kind` key from a type with a mapped type?**
`{ [K in keyof T as Exclude<K, "kind">]: T[K] }`, or just `Omit<T, "kind">`.

## Say it (about 40 seconds)
"TypeScript can build types from other types. `keyof` gives the keys, `typeof` lifts a value's type, and indexed access like `Person['age']` reads a property's type. Conditional types are if/else for types, with `infer` to capture part of a type, which is how `ReturnType` works; watch out that they distribute over unions. Mapped types loop over keys and can add or remove `readonly` and `?`, or rename keys with `as`. Template literal types combine strings, which lets an `on('ageChanged')` API type its callback from the event name."
