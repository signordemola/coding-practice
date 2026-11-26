# 03. ★ `type` vs `interface`

Asked in the micro1 Backend interview (19 Nov 2026), so it gets extra drills. Replaces old guide T1.

**Sources (typescriptlang.org, read in full):**
- [Everyday Types: "Differences Between Type Aliases and Interfaces"](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces)
- [Object Types: extending, intersections, "Interface Extension vs. Intersection"](https://www.typescriptlang.org/docs/handbook/2/objects.html)

**Run the checks:** `node interview-prep/modules/02-typescript/examples/run-all.js` (this topic: `examples/03-type-vs-interface.ts`)

## Explain

The handbook: they're very similar, and **almost every `interface` feature is available with `type`**. The key difference is that **a type can't be re-opened to add new properties, while an interface is always extendable**.

| | `interface` | `type` alias |
|---|---|---|
| Object shapes | Yes | Yes |
| Unions, primitives, tuples, function types, mapped/conditional types | No: interfaces only describe object shapes | Yes |
| Extending | `interface B extends A {}` | `type B = A & {…}` (intersection) |
| Declaring the same name twice | **Merges** ("declaration merging") | Error 2300, duplicate identifier |
| Conflicting property when extending | Error at the declaration (2430) | Silently becomes `never` |
| Names in error messages | Always shown by name | Before TS 4.2, an alias name could appear in place of the equivalent anonymous type |

More facts from the handbook:
- An interface can extend several interfaces at once (`extends A, B`), and it can extend a type alias of an object type (not on the page; checked with tsc in the example).
- Interfaces with `extends` "can often be more performant for the compiler" than type aliases with intersections (Everyday Types page, linking to the TypeScript wiki's Performance page, which I haven't read).
- The handbook's rule of thumb: **use `interface` until you need features from `type`.**

### Why merging exists
Libraries use it to let you add to a type you don't own: two `interface Window` declarations combine. The handbook's example adds a property to `Window`. (Re-opening a library's interface from another file is called module augmentation; I haven't covered that page.)

### Extension vs intersection with a conflict
```ts
interface Person1 { name: string }
interface Person2 extends Person1 { name: number } // error 2430: incorrectly extends
type Both = Person1 & { name: number };             // fine…
const b: Both = { name: "x" };                      // …but name is never: error 2322
```
The interface version fails early with a clear message; the intersection fails later, wherever you try to create a value.

## Worked example (checked in `examples/03-type-vs-interface.ts`)

```ts
type BookingStatus = "pending" | "confirmed" | "cancelled"; // only a type can be a union
type Formatter = (amountMinor: number) => string;            // function type

interface Base { createdAt: string }
interface Booking extends Base { status: BookingStatus }

interface Settings { theme: string }
interface Settings { locale: string }   // merged: Settings now needs both
const s: Settings = { theme: "dark" };  // error 2741: locale is missing
```

## Traps
- Saying "interfaces are faster" as a general rule. The docs only say `extends` is often faster **than intersections**.
- Saying "types can't be extended". They can, with `&`; they can't be **re-opened**.
- Accidental merging: two interfaces with the same name in one scope combine silently, which can surprise you.
- An intersection with conflicting property types doesn't error where it's declared.

## Practice questions

**Q1. What's the main difference between `type` and `interface`?**
An interface can be re-opened (declaration merging); a type alias can't. And a type alias can name any type (unions, tuples, functions), while an interface only describes object shapes.

**Q2. When would you pick each?**
Following the handbook: interfaces for object shapes (especially public ones others may extend), types when I need a union, tuple, function type or a mapped/conditional type. Mostly, be consistent within a codebase.

**Q3. Predict:**
```ts
interface A { id: string }
type B = A & { id: number };
const x: B = { id: "1" };
```
Error 2322: `id` is `string & number`, which is `never`.

**Q4. Can an interface extend a `type`?** Yes, if the type is an object shape (`type Base = { createdAt: string }; interface Booking extends Base {}`). Not if it's a union.

**Q5. Two `interface Config` declarations in the same file: what happens?** They merge into one interface with both sets of properties. Two `type Config` declarations: error 2300.

## Say it (about 40 seconds)
"Both can describe an object's shape, and for that they're mostly interchangeable. The key difference: an interface can be re-opened, and declarations with the same name merge, which is how libraries let you add fields. A type alias can't be re-opened, but it can name anything: a union like `'pending' | 'paid'`, a tuple, a function type, or a mapped type. Interfaces extend with `extends`, which errors clearly on a conflict; types combine with `&`, where a conflict silently becomes `never`. The handbook's rule is interface until you need a type feature; I use interfaces for object shapes and types for unions."
