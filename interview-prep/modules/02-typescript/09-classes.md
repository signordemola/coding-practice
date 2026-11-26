# 09. ★ Classes: `implements` vs `extends`, visibility, `abstract`, `this`

`implements` vs `extends` was asked in the micro1 Backend interview (19 Nov 2026). Replaces old guide T2. The JavaScript side of classes (prototypes, field order, `this`) is in module 01 topics 03–04.

**Sources (typescriptlang.org, read in full):** [Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html) · [tsconfig: `noImplicitOverride`](https://www.typescriptlang.org/tsconfig/#noImplicitOverride), [`strictPropertyInitialization`](https://www.typescriptlang.org/tsconfig/#strictPropertyInitialization), [`erasableSyntaxOnly`](https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly)

**Run the checks:** `node interview-prep/modules/02-typescript/examples/run-all.js` (this topic: `examples/09-classes.ts`)

## Explain

### Fields
- `strictPropertyInitialization`: a field must be set **in the constructor** (2564). Methods called from the constructor don't count (a subclass might override them).
- `name!: string` (definite assignment assertion) says "something else sets it". It's a promise; the value is still `undefined` until then.
- `readonly` fields: only in the declaration or the constructor (2540 elsewhere). Compile-time only.
- Constructors can't have type parameters (those go on the class) or a return type annotation.
- In a derived class, `super()` must run before `this` (17009).

### ★ `implements` = a check; `extends` = inheritance

| | `class A implements I` | `class A extends B` |
|---|---|---|
| What it means | "Check that A fits I's shape" | "A inherits B's code" |
| Gets code? | **No.** Nothing is added to the class | Yes: B's methods and fields, `super.method()` |
| Types the class? | **No.** The handbook: it doesn't change the class's types at all | Yes: A is a subtype of B |
| How many | Several: `implements I, J` | One base class |
| Runtime | Erased completely | Real JavaScript inheritance (prototype chain) |

The handbook's two `implements` surprises (both checked):
1. `check(s)` in a class implementing `check(name: string): boolean` is still an **implicit `any`** (7006). The interface doesn't type the method for you.
2. An optional interface property (`y?: number`) **isn't created** on the class: `c.y = 10` is an error (2339).

### Overriding
- An override must keep the derived class a valid **subtype**: `greet(name: string)` overriding `greet()` is an error (2416), because code holding a `Base` would call `greet()` with no argument and crash (the example shows the crash).
- With `noImplicitOverride` (on in this repo) every override needs the `override` keyword (4114). It catches a method that stops overriding because the base renamed its method.
- JavaScript initialisation order: base fields → base constructor → derived fields → derived constructor. So a base constructor sees the **base** field value.
- `declare resident: Dog;` re-declares a field's type without emitting it (for `useDefineForClassFields`/ES2022+ targets).

### Visibility

| Modifier | Accessible from | Runtime |
|---|---|---|
| `public` (default) | anywhere | normal property |
| `protected` | the class and subclasses (2445 outside) | normal property |
| `private` | only the declaring class (2341, even in subclasses) | normal property: **"soft private"** |
| `#field` (JavaScript) | only inside the class body | **hard private**: enforced by JavaScript (it doesn't show up in `Object.keys`, checked) |

- `private` and `protected` are **type-check only**. Bracket access `obj["secretKey"]` is even allowed by TS. For real protection the handbook points to closures, `WeakMap`s or `#private`.
- `private` is per **class**, not per instance: a method can read `other.secret` of another instance.
- A subclass may make a `protected` member `public` (repeat `protected` if you didn't mean to). It can't make a `private` one visible (2415).
- `private`/`protected` members also make class compatibility nominal-like (topic 11).

### `abstract`
- An abstract class can't be instantiated (2511); a concrete subclass must implement the abstract members (2515).
- To accept "a constructor of some concrete subclass", type the parameter as `new () => Base`, not `typeof Base` (passing the abstract class itself is rejected, 2345).

### `this`
- At runtime `this` depends on the call site (module 01, topic 03): `obj.getName = c.getName` then `obj.getName()` uses `obj`.
- Fixes from the handbook:
  1. **Arrow function field** `getName = () => this.name`: always right, but one function per instance, and subclasses can't call it with `super`.
  2. **`this` parameter** `getName(this: MyClass)`: erased at runtime, but TS rejects a detached call (2684). One function per class; still possible to misuse from plain JS.
- **`this` types:** a method returning `this` keeps the subclass type when chaining; `other: this` restricts a parameter to the same class; `isFile(): this is FileRep` narrows.

### Static members, generics
- `static` members (with visibility) are inherited. Names like `name`, `length`, `call` are forbidden for statics (2699). There are no "static classes"; use a plain object or functions.
- Static members can't use the class's type parameters (2302): there's only one runtime slot.

### Parameter properties: not allowed here
`constructor(public readonly x: number)` creates and assigns a field. It generates code, so it isn't erasable: tsc reports 1294 under `erasableSyntaxOnly`, and Node refuses it (`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`). Both are checked in `examples/12-*`. Write the field and the assignment out.

## Worked example (checked in `examples/09-classes.ts`)

```ts
interface PaymentProvider {
  charge(amountMinor: number, bookingId: string): Promise<string>;
}
class FakeProvider implements PaymentProvider {     // a check, no code added; params typed by me
  charges: string[] = [];
  async charge(_amountMinor: number, bookingId: string) {
    this.charges.push(bookingId);
    return `fake_${bookingId}`;
  }
}
async function takeDeposit(provider: PaymentProvider, bookingId: string) {
  return provider.charge(2500, bookingId);           // booking code only knows the interface
}

abstract class Notifier {
  abstract send(to: string): string;
  notify(to: string) { return `sent: ${this.send(to)}`; } // inherited by subclasses
}
class SmsNotifier extends Notifier {
  send(to: string) { return `SMS to ${to}`; }
}
```
Why it matters: the booking code depends on the interface, so a real Stripe class and this fake are interchangeable, and tests never touch the network. (The `PaymentProvider` idea comes from the old guide; this version is run in the example.)

## Traps
- Believing `implements` gives you the interface's types or members.
- Believing `private` hides data at runtime.
- Overriding with an incompatible signature, or without `override`.
- Detached methods losing `this`; and arrow fields costing one function per instance.
- Writing parameter properties in a type-stripping project.

## Practice questions

**Q1. `implements` vs `extends`?**
`extends` inherits a class's code and makes the child a subtype; one base class. `implements` only checks the class matches an interface's shape; it adds nothing, can list several interfaces, and disappears at runtime.

**Q2. A class implements `check(name: string): boolean` but writes `check(s)`. What's `s`'s type?** Implicit `any` (7006 under `noImplicitAny`). `implements` doesn't type the method.

**Q3. `private` vs `#private`?**
`private` is a compile-time check: the property is normal at runtime and even `obj["x"]` passes TS. `#x` is enforced by JavaScript.

**Q4. Why can't an override add a required parameter?**
Code typed as the base class would call it without the argument. The derived class must stay substitutable (2416).

**Q5. What does `noImplicitOverride` catch?**
A method that overrides without saying `override`, so renaming or removing the base method doesn't silently leave a non-overriding method behind.

**Q6. Abstract class or interface?**
An interface when I only need a contract (several can be implemented, nothing at runtime). An abstract class when subclasses should share real code, like `notify()` above, plus a contract for the abstract parts.

**Q7. Predict:**
```ts
class Base { name = "base"; constructor() { console.log(this.name); } }
class Derived extends Base { override name = "derived"; }
new Derived();
```
Logs `base`: base fields and the base constructor run before derived fields are set.

## Say it (about 45 seconds)
"`extends` is inheritance: the subclass gets the base class's code, can override it, and must stay compatible so it can be used wherever the base is expected; I mark overrides with `override`. `implements` is only a check: the class gets no code and no types from the interface, and it vanishes at runtime. I use interfaces like `PaymentProvider` so booking logic doesn't depend on Stripe and tests can use a fake. For privacy, TypeScript's `private` is compile-time only; JavaScript's `#field` is enforced at runtime. Abstract classes are for shared code plus a contract."
