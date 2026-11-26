# 08. Utility types

**Sources (typescriptlang.org, read in full):** [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

**Run the checks:** `node interview-prep/modules/02-typescript/examples/run-all.js` (this topic: `examples/08-utility-types.ts`, booking-flavoured; the booking shapes are generic, not from a client)

## Explain

| Type | Does | Booking example |
|---|---|---|
| `Partial<T>` | all properties optional | `updateBooking(b, fields: Partial<Booking>)` |
| `Required<T>` | removes `?` | a fully-filled record |
| `Readonly<T>` | all readonly (models `Object.freeze`) | a confirmed booking passed to a renderer |
| `Record<K, T>` | object with keys `K`, values `T` | `Record<Status, string>` labels: every status must have one (2741) |
| `Pick<T, K>` | keep those properties | `Pick<Booking, "startsAt" \| "status">` for a card |
| `Omit<T, K>` | drop those properties | `Omit<Booking, "id" \| "status">` for a create form |
| `Exclude<U, E>` | drop **union members** assignable to `E` | `Exclude<Status, "cancelled">` |
| `Extract<T, U>` | keep union members assignable to `U` | `Extract<Event, { type: "refund" }>` |
| `NonNullable<T>` | drop `null`/`undefined` | |
| `Parameters<F>` | parameter tuple | `Parameters<typeof quote>` |
| `ReturnType<F>` | return type | |
| `ConstructorParameters<C>` / `InstanceType<C>` | for classes | `InstanceType<typeof Slot>` |
| `Awaited<T>` | unwrap promises **recursively** | `Awaited<ReturnType<typeof loadBooking>>` |
| `NoInfer<T>` (5.4) | stop this position from affecting inference | a default value that must be one of the listed options |
| `ThisParameterType`, `OmitThisParameter`, `ThisType` | `this` helpers (`ThisType` needs `noImplicitThis`) | |
| `Uppercase` etc. | string manipulation (topic 07) | |

Details from the page:
- `Parameters` and `ReturnType` on an **overloaded** function use the **last** signature.
- `Awaited<boolean | Promise<number>>` → `boolean | number`.
- `Omit` and `Pick` work on **object properties**; `Exclude`/`Extract` on **union members**. Mixing them up is a common slip.

From running the checks (not on the page):
- `Omit<Booking, "idd">` compiles: `Omit`'s key parameter isn't limited to existing keys, so a typo removes nothing. (`Pick` is limited to `keyof T`.)
- `Required<Booking>` from a spread of an object whose `notes` is optional fails with 2322 (optional vs required), not 2741.

## Worked example (checked in `examples/08-utility-types.ts`)

```ts
interface Booking {
  id: string; serviceId: string; startsAt: string;
  status: "pending" | "confirmed" | "cancelled";
  depositMinor: number; notes?: string;
}
type NewBooking = Omit<Booking, "id" | "status">;     // create-form payload
type BookingPatch = Partial<Pick<Booking, "startsAt" | "notes">>; // what a reschedule may change
const labels: Record<Booking["status"], string> = {
  pending: "Awaiting deposit", confirmed: "Booked", cancelled: "Cancelled",
};

function createStreetLight<C extends string>(colors: C[], defaultColor?: NoInfer<C>) {}
createStreetLight(["red", "yellow", "green"], "blue"); // error 2345 thanks to NoInfer
```

## Traps
- Typos in `Omit` keys.
- `Exclude` on an object type instead of `Omit`.
- `Readonly<T>` is shallow and compile-time only; `Object.freeze` is the runtime version (also shallow).
- `Partial<T>` for an update makes `{}` valid: check that at least one field was sent, at runtime.

## Practice questions

**Q1. `Omit` vs `Exclude`?** `Omit<T, K>` removes properties from an object type. `Exclude<U, E>` removes members from a union.

**Q2. Type the payload for "create booking" when the server sets `id` and `status`.** `Omit<Booking, "id" | "status">`.

**Q3. What does `Record<Status, string>` guarantee that `{ [k: string]: string }` doesn't?** Every status key must be present, and no other keys are allowed in a literal.

**Q4. Get the resolved type of an async function's result.** `Awaited<ReturnType<typeof fn>>`.

**Q5. What problem does `NoInfer` solve?** Without it, every argument contributes to inferring `C`, so a bad default like `"blue"` widens `C` instead of being rejected.

**Q6. Implement `Partial` and `Pick` yourself.**
`type MyPartial<T> = { [K in keyof T]?: T[K] }`; `type MyPick<T, K extends keyof T> = { [P in K]: T[P] }`.

## Say it (about 30 seconds)
"Utility types are built-in mapped and conditional types. For a booking API I'd use `Omit<Booking, 'id' | 'status'>` for the create payload, `Partial` of a `Pick` for what a reschedule may change, `Record<Status, string>` so every status has a label, and `Awaited<ReturnType<typeof load>>` to get an async result's type. `Omit` and `Pick` work on properties; `Exclude` and `Extract` on union members. And they're all compile-time: `Readonly` doesn't freeze anything."
