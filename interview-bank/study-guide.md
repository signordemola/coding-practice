# Interview study guide

**My own reference notes.** Tutors (Codex, Copilot) quiz me from this file and give hints, but **never read the answers to me**. I read it myself. Same thinking contract as `AGENTS.md`.
This file is a question source like the rest of `interview-bank/`, not a second syllabus.

One file for every role. Organised by **topic**, not by job: when a new role or interview asks for something new, it's added to the matching part, and logged in Part H.

**Layout of each topic:** Explain · Example · Common mistake · Connected ideas · Say it (the short interview answer) · Likely follow-up (the deeper "walk me through it" question).

**Current facts (checked 24 Nov 2026):** React 19.2 is current (patch 19.2.7, June 2026). React Compiler 1.0 has been stable since October 2025 (automatic memoization; Next.js 16 supports it with `reactCompiler: true`). React 19 added form Actions (`<form action>`, `useActionState`, `useFormStatus`, `useOptimistic`), `ref` as a normal prop, and in 19.2 `useEffectEvent` and `<Activity>`.

## Role map: what to read for each role

| Role | Read |
|---|---|
| micro1 Senior Frontend Developer (JavaScript) | A (React, incl. R11 Redux Toolkit) · B (JavaScript, incl. J11 `this`, J12 prototypes) · C (TypeScript) · F (coding) |
| micro1 Software Engineer, New Grad | D (full-stack) · B (J2, J3, J5, J6, J11) · C · E (debugging) · F (coding) · G (stories) |
| micro1 Software Engineer, Internal Platforms | D (full-stack) · C (TypeScript) · B (async: J2, J5) · E · F |

## Contents
- Part A: React (R1–R11)
- Part B: JavaScript (J1–J12)
- Part C: TypeScript (T1–T3)
- Part D: Full-stack fundamentals (F1–F5)
- Part E: Debugging and problem solving (D1, D2)
- Part F: Coding patterns (P0, then practice in `lesson-04/`)
- Part G: Ownership stories (kept private)
- Part H: Interview log

---

# Part A: React

## R1. Key advanced JavaScript concepts a React developer should master

**Explain**
React is "just JavaScript", so a few JS ideas decide whether your React code works:
1. **Values vs references.** Numbers and strings are copied. Objects and arrays are shared by reference: two variables can point to the same object.
2. **Immutability.** React decides whether to re-render by checking if the new state is a *different object* from the old one (it uses `Object.is`, which works like `===`). If you change an object in place, it's still the same object, so React may not notice.
3. **Closures.** Every function remembers the variables around it when it was made. Every render of a component creates new functions with that render's values.
4. **Promises and async/await.** Used for fetching, payments, anything slow.
5. **ES6+ syntax:** destructuring, spread/rest, arrow functions, template strings, optional chaining (`?.`), nullish coalescing (`??`).
6. **Functional patterns:** pure functions (same input gives same output, no side effects), and `map`/`filter`/`reduce` instead of loops that change data.

**Example**
```jsx
// WRONG: mutates the same object. React compares old === new and sees "same".
booking.status = "paid";
setBooking(booking);          // may not re-render

// RIGHT: a new object with one field changed
setBooking({ ...booking, status: "paid" });

// Arrays: return new arrays
setSlots(slots.filter((s) => s.id !== takenId));          // remove
setSlots([...slots, newSlot]);                             // add
setSlots(slots.map((s) => (s.id === id ? { ...s, held: true } : s))); // update one
```

**Common mistake**
`push`, `splice`, `sort` and `reverse` **change the original array**. `slots.sort(...)` then `setSlots(slots)` changes the same array, so React can miss it. Use `[...slots].sort(...)` or the newer `slots.toSorted(...)`, which returns a new array.
Spread is **shallow**: `{ ...booking }` copies the top level only. If you change `booking.client.name`, you must copy `client` too: `{ ...booking, client: { ...booking.client, name } }`.

**Connected ideas**
- `===` on objects compares *identity*, not content: `{a:1} === {a:1}` is `false`.
- Pure functions are why booking-engine's rules live outside components: they're easy to test.
- Prototypes: every object has a hidden link to another object it borrows methods from (that's how `[].map` exists). You rarely write prototypes by hand, but classes are built on them.

**Say it**
"Closures, promises and async/await, ES6+ like destructuring and spread, and functional patterns like pure functions and not mutating data. The big one for React is references: React re-renders when state is a *new* object, so I update immutably, like `{ ...booking, status: 'paid' }`, and avoid mutating methods like `push` or `sort` on state."

---

## R2. The React component lifecycle and its use cases

**Explain**
A component goes through three phases:
- **Mount:** it appears on screen for the first time.
- **Update:** it renders again because its state, its parent, or a context it uses changed.
- **Unmount:** it's removed from the screen.

React works in two steps each time: **render** (call your component to work out what the UI should look like; this must be pure, with no side effects) and **commit** (apply changes to the real DOM). Effects run **after** commit.

With hooks, `useEffect` covers all three phases:
- `useEffect(fn, [])` runs after the first mount.
- `useEffect(fn, [date])` runs after mount, then again whenever `date` changes.
- The function you **return** from the effect is the cleanup. It runs before the effect re-runs, and on unmount.

**Example: load slots for the selected date, safely**
```jsx
function Slots({ date }) {
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    let ignore = false;                      // protects against out-of-order responses
    fetch(`/api/slots?date=${date}`)
      .then((r) => r.json())
      .then((data) => { if (!ignore) setSlots(data); });
    return () => { ignore = true; };         // cleanup: ignore the old request
  }, [date]);                                // re-run when date changes

  return <SlotList slots={slots} />;
}
```
If the user clicks Monday then quickly Tuesday, Monday's response might arrive last. The cleanup marks it as stale, so Tuesday's slots win.

**Common mistakes**
- **Missing cleanup.** A listener, interval or socket created in an effect and never removed keeps running after the component is gone.
- **"My effect runs twice!"** In development, Strict Mode deliberately runs setup, then cleanup, then setup again, to expose missing cleanup. It doesn't happen in production. The fix is a correct cleanup, not removing Strict Mode.
- **Stale closure:**
```jsx
useEffect(() => {
  const id = setInterval(() => setSeconds(seconds + 1), 1000); // always sees seconds = 0
  return () => clearInterval(id);
}, []);
// Fix: use the updater form, which gets the latest value
setSeconds((s) => s + 1);
```

**Connected ideas**
- **You might not need an Effect.** Effects are for syncing with *outside* systems (network, browser APIs, timers, third-party widgets). If you're just calculating something from props or state, calculate it during render: `const total = items.reduce(...)`, not an effect that sets `total` state.
- Class components had `componentDidMount`, `componentDidUpdate` and `componentWillUnmount` for the same three jobs.
- `useEffectEvent` (React 19.2) lets an effect read the latest props without re-running when they change.

**Say it**
"Mount, update, unmount. React renders, commits to the DOM, then runs effects. With hooks, `useEffect` with an empty array runs on mount, with dependencies whenever they change, and its returned cleanup runs before the next run and on unmount. I use cleanup for listeners, timers and stale requests: when the selected date changes, I ignore the old fetch so a slow response can't overwrite the new one."

---

## R3. Approaches to managing state in large React apps

**Explain**
"State" isn't one thing. Sort it by **type**, then pick the simplest tool for each:

| Type of state | Example | Tool |
|---|---|---|
| Local UI | Is the modal open? | `useState` |
| Multi-step logic | Booking flow: service, time, intake, pay | `useReducer` |
| Shared, rarely changes | Signed-in user, theme | Context |
| Shared, changes often | Cart across many pages | Zustand / Redux |
| Server data | Slots, bookings from the API | React Query / SWR, or Next.js server components |
| URL state | Selected date, filters | Search params (`?date=2026-11-24`) |
| Form state | Inputs while typing | Controlled inputs or form Actions |

**Example: a booking flow with `useReducer`**
```jsx
function reducer(state, action) {
  switch (action.type) {
    case "pickService": return { ...state, service: action.service, step: "time" };
    case "pickTime":    return { ...state, time: action.time, step: "intake" };
    case "back":        return { ...state, step: action.to };
    default: return state;
  }
}
const [flow, dispatch] = useReducer(reducer, { step: "service" });
dispatch({ type: "pickService", service: "Lash fill" });
```
All the rules for moving between steps live in one pure function you can test.

**Common mistakes**
- **Copying server data into local state** and then it goes out of date. Let React Query or the server own it.
- **Storing what you can calculate.** Don't keep `total` in state next to `items`; calculate it.
- **One giant Context** for everything. Every component using it re-renders when any part changes.

**Connected ideas**
- Putting the selected date in the URL means refresh and "share this link" just work.
- In Next.js, server components can fetch data on the server, so less state is needed on the client at all.

**Say it**
"I first ask what kind of state it is. Local UI state uses `useState`; multi-step logic like a booking flow uses `useReducer`; light shared data like the user uses Context; frequently changing shared state uses a store like Zustand or Redux; server data uses React Query or server components; and things like the selected date go in the URL. I keep the source of truth in one place and calculate everything else."

---

## R4. Techniques to optimise re-rendering

**Explain**
A component re-renders when:
1. Its own state changes.
2. Its **parent re-renders** (even if the props didn't change).
3. A context it uses changes.

A re-render isn't automatically bad: React only touches the DOM where something actually changed. It becomes a problem when the component is **expensive** (big lists, charts) or renders very often (typing, scrolling).

Tools:
- **`React.memo(Component)`** skips re-rendering if the props are shallowly equal.
- **`useMemo`** caches a calculated value; **`useCallback`** caches a function. They keep props "the same" so `memo` works.
- **React Compiler 1.0** (stable since Oct 2025) adds this memoization automatically at build time. React's advice for new code is to rely on the compiler and use `useMemo`/`useCallback` only where you need precise control.
- **Structure fixes:** move state down into the component that uses it; pass components as `children` so they aren't re-created.
- **Long lists:** virtualize (only render visible rows, e.g. TanStack Virtual).

**Example: why `memo` silently fails**
```jsx
const SlotGrid = memo(function SlotGrid({ slots, onPick }) { /* expensive */ });

function Page() {
  const [note, setNote] = useState("");
  // A new function on every render, so memo sees "new props" each time:
  return <SlotGrid slots={slots} onPick={(t) => pick(t)} />;
}
// Fix without the compiler: keep the function stable
const onPick = useCallback((t) => pick(t), []);
```

**Common mistakes**
- Wrapping everything in `useMemo` "just in case". It adds code and has a small cost. Measure first.
- **Index as key** in lists that reorder or delete: React mixes up which row has which state. Use a stable id (`key={slot.id}`).

**Connected ideas**
- The **React DevTools Profiler** shows which components rendered and why.
- This is closures and references again: each render creates new functions and objects.

**Say it**
"I measure first with the Profiler. Then I fix structure: keep state close to where it's used and use stable keys. For expensive components I use `React.memo` with `useMemo` and `useCallback` so props stay stable, though with React Compiler 1.0 most of that memoization is now automatic, so I'd use the hooks only where I need precise control. For long lists, virtualization."

> **Likely follow-up: "How does React know what changed?"**
> - Each render, your components return a description of the UI (often called the virtual DOM). React compares the new description with the previous one. This is **reconciliation**.
> - Same element type in the same position: React **updates** it and keeps its state.
> - Different type (`<div>` becomes `<section>`, or `<Form>` becomes `<Summary>`): React **throws away** the old one, including its state, and creates the new one.
> - In lists, the **key** tells React which item is which. With stable keys, a deleted row removes the right item; with index keys, state can end up attached to the wrong row.
> - Then React changes only the parts of the real DOM that are different.
>
> Say it: "React compares the new element tree with the last one. Same type in the same place gets updated and keeps its state; a different type gets replaced. In lists, keys tell React which item is which, so I use stable ids. Then it only touches the DOM nodes that actually changed."

---

## R5. Controlled vs uncontrolled components

**Explain**
- **Controlled:** React state holds the input's value. Every keystroke goes through state. You can validate live, disable buttons, format input.
- **Uncontrolled:** the DOM holds the value. You read it when needed (with a ref, or from the form on submit). Less code, fewer re-renders.

React 19's form **Actions** make uncontrolled forms much nicer: `<form action={fn}>` gives your function the form's `FormData`, `useActionState` tracks the result and pending state, and React resets the uncontrolled fields after a successful submit.

**Example: controlled (live rule)**
```jsx
const [consent, setConsent] = useState(false);
<input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
<button disabled={!consent}>Pay deposit</button>
```

**Example: uncontrolled with a React 19 Action**
```jsx
const [error, submit, isPending] = useActionState(async (prev, formData) => {
  const name = formData.get("name");
  if (!name) return "Name is required";
  await saveBooking({ name });
  return null;
}, null);

<form action={submit}>
  <input name="name" defaultValue="" />
  <button disabled={isPending}>{isPending ? "Booking..." : "Book"}</button>
  {error && <p>{error}</p>}
</form>
```

**Common mistakes**
- Switching between the two: `value={client.phone}` where `phone` is `undefined` at first. React warns "changing an uncontrolled input to be controlled". Use `value={client.phone ?? ""}`.
- Input values are always **strings**: `e.target.value` from a number input is `"2"`, not `2`.

**Connected ideas**
- `value` vs `defaultValue`: `value` means controlled; `defaultValue` just sets the starting value (uncontrolled).
- `useFormStatus` lets a submit button inside the form know if the form is pending.

**Say it**
"Controlled means React state holds the value, so I can validate as the user types; my booking forms keep the pay button disabled until consent is ticked. Uncontrolled means the DOM holds it and I read it on submit, which is less code. React 19's form Actions with `useActionState` make uncontrolled forms easy: you get the FormData, a pending flag and the error back without extra state."

> **Likely follow-up: "Where do you validate the form?"**
> - **Both places, for different reasons.**
> - **Client-side validation** is for the user: quick feedback, like "phone number is missing", before anything is sent.
> - **Server-side validation** is for safety: anyone can skip your form and send a request directly, so the server **never trusts** what arrives.
> - A schema library like **Zod** lets you write the rules once and use them on both sides.
> ```ts
> const BookingSchema = z.object({
>   name: z.string().min(1),
>   phone: z.string().min(7),
>   serviceId: z.string(),
> });
> const result = BookingSchema.safeParse(Object.fromEntries(formData));
> if (!result.success) return { error: "Please check your details" };
> ```
> - The server also checks **business rules** the client can't be trusted with: is the slot still free, is the price correct. Never take the price from the browser.
>
> Say it: "Both. Client-side validation gives the user quick feedback, but the server never trusts the client, because anyone can send a request directly. I define the rules once with a schema like Zod and run it on the server, which also checks business rules like whether the slot is still free and what the real price is."

---

## R6. Organising components in a large codebase

**Explain**
The goal is that someone new can find things and change one feature without breaking others.
- **Group by feature, not by file type.** `features/booking/` holds its components, hooks, tests and types together.
- **Separate logic from display.** The old pattern was "container vs presentational components"; with hooks, the logic goes in a **custom hook** (`useBookingFlow`) and the component just displays.
- **Business rules in plain functions** outside React, fully tested. That's exactly how booking-engine works: slots, money and rules are plain TypeScript.
- **Small reusable UI pieces** (Button, Card, Field) in a shared `ui/` folder.
- **In Next.js:** keep server components by default and add `'use client'` only where you need interactivity, as low in the tree as possible.

**Example layout**
```
app/          # routes and pages only
features/     # one folder per business area: billing, clients, pricing...
components/   # shared UI
hooks/        # shared custom hooks
lib/          # shared helpers, each with its test beside it
  amount-input.ts
  amount-input.test.ts
```
- **`app/` stays thin:** routes decide *what page*; features hold *how it works*.
- **Shared things live once:** if two features need it, it moves up.
- **Tests sit next to the code**, so missing tests are obvious.
- **Code splitting:** heavy parts (charts, editors, modals) load only when needed with `next/dynamic` or `React.lazy`, so the first page load stays small.
```jsx
const BookingCalendar = dynamic(() => import("@/features/booking/BookingCalendar"), {
  loading: () => <p>Loading calendar...</p>,
});
```

**Common mistakes**
- Business rules hidden inside components, so they can't be tested or reused.
- Huge "barrel" `index.ts` files that re-export everything: handy, but they can slow builds and tests and cause circular imports. Keep them small, or import directly.

**Connected ideas**
- **Colocation:** keep things as close as possible to where they're used.
- Custom hooks are just functions that use other hooks; they're how you reuse logic in React.

**Say it**
"I keep the `app` folder for routes only and group the real logic by business area under `features`, like billing or clients. Anything shared moves up into `components`, `hooks` or `lib`, with tests beside each helper. I use code splitting a lot: heavy parts like calendars or modals load only when needed with `next/dynamic`, so the first load stays fast. And I keep components on the server by default, adding `'use client'` only where I need interactivity."

> **Likely follow-up: "How do you test the files in `lib`?"**
> - `lib` files are **plain functions**: same input, same output, no UI. They're the easiest and most valuable code to test, because they often hold the rules that hurt if they break (money, dates).
> - **What to test:**
>   - the normal case;
>   - **edge cases:** empty, zero, negative, very large, decimals, rounding;
>   - **bad input:** letters where a number should be, `null`, `undefined`;
>   - **bugs you fixed:** write a test that fails first, then fix it, so the bug can't come back.
> - **Why next to the file:** you see straight away when something has no test.
> - **Tools:** Vitest, run while working and in CI on every push, so a failing test blocks the merge.
> - **Mocking:** not for pure functions; just call them. Only mock what's outside your control: the network, the clock, the database. For time logic, fake the clock so tests don't depend on today's date.
> - **Test levels:** many fast **unit** tests for `lib`; fewer **integration** tests where pieces meet (an API route plus the database); a few **end-to-end** tests for the critical flow (book and pay a deposit).
> ```ts
> import { describe, it, expect } from "vitest";
> import { toMinorUnits } from "./money";   // example function, not from a real project
>
> describe("toMinorUnits", () => {
>   it("converts pounds to pence", () => expect(toMinorUnits("12.50")).toBe(1250));
>   it("handles zero", () => expect(toMinorUnits("0")).toBe(0));
>   it("rejects letters", () => expect(() => toMinorUnits("abc")).toThrow());
> });
> ```
> Tip: if they ask about a real test file of yours, describe only what it actually checks. Open it before the interview.
>
> Say it: "Lib files are plain functions, so they're cheap to test and usually hold the important rules. I test the normal case, then the edges like zero, empty and rounding, then bad input, and when I fix a bug I write a failing test first so it can't come back. Tests sit beside the file and run in Vitest locally and in CI. I don't mock pure functions; I only mock things like the network or the clock."

> **Likely follow-up: "What's the difference between server and client components?"**
> - In the Next.js App Router, components are **server components by default**. They run on the server, can be `async`, can read the database or secrets directly, and send **no JavaScript** for themselves to the browser.
> - **Client components** start with `'use client'`. They run in the browser too, so they can use state, effects, event handlers and browser APIs like `window`.
> - `'use client'` marks a **boundary**: that file and everything it imports becomes client code. So put it as **low** in the tree as possible, on the small interactive part (a slot picker), not on the whole page.
> - Server components can pass **children** into client components, so a client wrapper can still contain server-rendered content.
>
> Say it: "Server components are the default: they run on the server, can fetch data and use secrets directly, and ship no JavaScript for themselves. Client components, marked with `'use client'`, run in the browser and are needed for state, effects and event handlers. The directive is a boundary, so I put it as low as possible, only on the interactive pieces."

> **Likely follow-up: "How does code splitting work, and when wouldn't you use it?"**
> - Your app is bundled into files called **chunks**. Next.js already splits **per route**, so each page only loads its own code.
> - `next/dynamic` (or `React.lazy` with `Suspense`) splits further: the component goes into its own chunk, downloaded only when it's first rendered.
> - **Good to split:** heavy things that aren't needed straight away, like a calendar library, a rich-text editor, a chart, a modal opened by a click.
> - **Don't split:** small components (the extra request costs more than it saves), and anything visible on first load (it causes a loading flash or layout jump).
> - `ssr: false` in `next/dynamic` skips server rendering for things that only work in the browser.
>
> Say it: "The app is bundled into chunks, and Next.js already splits per route. With `next/dynamic` I move heavy components like a calendar or a chart into their own chunk that loads only when needed. I don't split small components or anything visible on first load, because the extra request or the loading flash isn't worth it."

---

## R7. Handling side effects in React

**Explain**
A **side effect** is anything that reaches outside the function: a network call, a timer, writing to storage, logging, changing the DOM directly. React's rule: **rendering must be pure**, so side effects go in one of these places:
1. **Event handlers:** the first choice when the effect is caused by a user action ("Pay" clicked, so call the API).
2. **`useEffect`:** to keep the component in sync with an outside system *because it's on screen* (subscribe to availability, start a timer).
3. **`useLayoutEffect`:** same, but runs before the browser paints. Use it only to measure or adjust layout and avoid a flicker.
4. **Data libraries** (React Query) or **server code** (Next.js server components and Actions) for fetching and mutations.
5. **Custom hooks** to package a repeated effect (`useDebounce`, `useOnlineStatus`).
6. In Redux, **middleware** (Thunk, Saga) or RTK Query.

**Example: effect caused by an action goes in the handler, not an effect**
```jsx
// WRONG: effect watching a flag
useEffect(() => { if (submitted) payDeposit(); }, [submitted]);

// RIGHT: do it where it happens
async function handlePay() {
  await payDeposit();
  router.push("/confirmed");
}
```

**Common mistakes**
- Effects that set state from other state (chains of effects): slow and buggy. Calculate during render instead.
- Fetching in an effect with no cleanup or race handling (see R2).

**Connected ideas**
- Strict Mode's double run in development is a test of your cleanup.
- Idempotency: a side effect that's safe to run twice. Payment webhooks must be idempotent (see J2).

**Say it**
"Rendering has to be pure, so side effects go elsewhere. If a user action causes it, like paying a deposit, it goes in the event handler. `useEffect` is for syncing with outside systems while the component is on screen, with a cleanup. `useLayoutEffect` only when I must measure layout before paint. For data I prefer React Query or server components, and I wrap repeated effects in custom hooks."

> **Likely follow-up: "In Next.js, how do you fetch data instead of using `useEffect`?"** (walk through it end to end)
> 1. **Reading data:** the page is a **server component**. It's `async`, queries the database (or an API) on the server, and sends ready HTML. No loading spinner, no secrets in the browser.
> ```tsx
> // app/book/[serviceId]/page.tsx
> export default async function Page({ params }) {
>   const { serviceId } = await params;
>   const slots = await getAvailableSlots(serviceId);   // runs on the server
>   return <SlotPicker slots={slots} />;                 // small client component
> }
> ```
> 2. **Changing data** (booking a slot): a **Server Action** (`'use server'`) called from a form. It validates the input, writes to the database, then refreshes the page data (`revalidatePath`).
> 3. **Outside callers** (Stripe webhooks, a mobile app): a **route handler**, `app/api/.../route.ts`.
> 4. **Live data on the client** (polling availability): a client component with React Query.
>
> Say it: "Pages are server components that fetch on the server, so the user gets ready HTML and no secrets reach the browser. Changes go through Server Actions that validate, write to the database and revalidate the page. Outside callers like Stripe hit route handlers. I only fetch on the client, with React Query, when the data must update live."

---

## R8. Advantages and limitations of Redux

**Explain**
Redux keeps app state in one **store**. You never change it directly: you **dispatch** an **action** (a plain object describing what happened), and a **reducer** (a pure function) returns the new state.
- **Good:** predictable (all changes go one way), excellent DevTools (see every action, time-travel), easy sharing across a large app, good for complex client state.
- **Limits:** more code and concepts, overkill for small apps, async needs middleware, and putting server data in Redux by hand duplicates work.
- **Modern Redux = Redux Toolkit (RTK).** `createSlice` removes most of the boilerplate and uses Immer, so you can write "mutating" code that's safely turned into immutable updates. **RTK Query** handles server data.

**Example: Redux Toolkit**
```js
const bookingSlice = createSlice({
  name: "booking",
  initialState: { status: "draft" },
  reducers: {
    markPaid(state) { state.status = "paid"; }, // Immer makes this safe
  },
});
dispatch(bookingSlice.actions.markPaid());
```

**Common mistakes**
- Putting everything in Redux, including local UI state like "is this dropdown open".
- Old-style Redux with hand-written action types everywhere. RTK is the official way now.

**Connected ideas**
- A reducer is the same idea as `useReducer` (R3), just app-wide.
- Lighter alternatives: Zustand, Jotai. Server data: React Query.

**Say it**
"Redux keeps state in one store, changed only by dispatching actions to pure reducers. That makes it predictable, with great DevTools, and good for large apps with lots of shared client state. The downsides are extra code and concepts, and it's overkill for small apps. Today I'd use Redux Toolkit, which cuts the boilerplate, and RTK Query or React Query for server data. Honestly, my own projects use local state, Context and server components more than Redux."

---

## R9. Integrating ES6+ features into React projects

**Explain**
- **Why it works in old browsers:** a build tool (**SWC** in Next.js, Babel elsewhere) rewrites modern syntax into older JavaScript, based on a list of target browsers (`browserslist`).
- **Syntax vs features:** syntax (arrow functions, `?.`) can be rewritten. New *built-in functions* (like `Array.prototype.toSorted`) can't be rewritten; they need a **polyfill** or a modern-enough target browser.
- **Team consistency:** ESLint and Prettier so everyone writes it the same way; TypeScript for types.

**Example: the ES6+ you use every day in React**
```jsx
function BookingCard({ booking: { client, service, deposit } }) {   // destructuring
  const label = `${service.name} for ${client?.name ?? "Guest"}`;   // template, ?., ??
  return <Card title={label} amount={deposit} />;
}
```

**Common mistake: `||` vs `??`**
```js
const deposit = service.deposit || 20;  // BUG: a deposit of 0 becomes 20
const deposit = service.deposit ?? 20;  // only null/undefined becomes 20
```
`||` treats `0`, `""` and `false` as "missing". `??` only treats `null` and `undefined` as missing. With money, that matters.

**Connected ideas**
- ES modules (`import`/`export`) are covered in J10.
- `async`/`await`, classes and spread are all ES6+ too.

**Say it**
"Modern syntax gets compiled by SWC in Next.js, or Babel, for the browsers we target, and new built-in functions may need polyfills. ES6+ makes React cleaner: destructured props, spread for immutable state, arrow handlers, optional chaining. I use `??` instead of `||` for defaults, because `||` would turn a zero deposit into the default. And we keep standards with ESLint, Prettier and TypeScript."

---

## R10. What happens to performance with bad state management

**Explain**
Bad state shows up as:
1. **Extra re-renders:** state too high in the tree, or one giant Context, so one change re-renders the whole page.
2. **Out-of-sync data:** the same fact stored in two places (`items` and `total`), and one gets updated while the other doesn't.
3. **Memory leaks:** effects that subscribe but never clean up.
4. **Effect chains:** effect A sets state, which triggers effect B, which sets more state. Slow, and hard to follow.
5. **Hard-to-change code:** nobody knows who owns what.

**Example: duplicated state goes out of sync**
```jsx
// BAD: two sources of truth
const [items, setItems] = useState([]);
const [total, setTotal] = useState(0);   // easy to forget to update

// GOOD: one source, calculate the rest
const [items, setItems] = useState([]);
const total = items.reduce((sum, i) => sum + i.price, 0);
```

**Common mistake**
Passing a new object as a Context value every render:
```jsx
<BookingContext.Provider value={{ booking, setBooking }}>   // new object each render
```
Every consumer re-renders whenever the provider renders. Fix: split the context, or keep the value stable (`useMemo`, or let the compiler handle it).

**Connected ideas**
- Single source of truth plus derived values is the same idea as normalising a database (Postgres): don't store the same fact twice.

**Say it**
"Bad state causes extra re-renders, data that goes out of sync, memory leaks from effects without cleanup, and chains of effects that are slow and hard to debug. I fix it by keeping one source of truth and calculating everything else, keeping state close to where it's used, splitting large contexts, and choosing the right tool for each type of state."

---

## R11. Redux Toolkit in more depth

**Explain**
Redux Toolkit (RTK) is the official way to write Redux. The main pieces:

| Piece | What it does |
|---|---|
| `configureStore` | Creates the store, with good defaults: DevTools, thunk middleware, checks that warn if you mutate state by accident |
| `createSlice` | One "slice" of state: its starting value plus reducers. It **generates the action creators** for you. Uses **Immer**, so "mutating" code is safe |
| `createAsyncThunk` | Async logic (API calls). Dispatches `pending`, `fulfilled` and `rejected` actions automatically |
| `extraReducers` | How a slice responds to actions it didn't define itself, like a thunk's `pending`/`fulfilled` |
| Selectors (`useSelector`, `createSelector`) | Read data from the store; `createSelector` caches derived data |
| **RTK Query** (`createApi`) | Data fetching and caching built in: generates hooks like `useGetSlotsQuery`, handles loading states, cache and refetching |

**Example: a full slice with an async thunk**
```js
import { createSlice, createAsyncThunk, configureStore } from "@reduxjs/toolkit";

export const fetchBookings = createAsyncThunk("bookings/fetch", async (date) => {
  const res = await fetch(`/api/bookings?date=${date}`);
  return res.json();                         // becomes action.payload
});

const bookingsSlice = createSlice({
  name: "bookings",
  initialState: { items: [], status: "idle", error: null },
  reducers: {
    bookingCancelled(state, action) {        // Immer: looks like mutation, is actually safe
      state.items = state.items.filter((b) => b.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookings.pending,   (state) => { state.status = "loading"; })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.status = "done";
        state.items = action.payload;
      })
      .addCase(fetchBookings.rejected,  (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const { bookingCancelled } = bookingsSlice.actions;   // generated for you
export const store = configureStore({ reducer: { bookings: bookingsSlice.reducer } });
```

**Using it in a component**
```jsx
const items = useSelector((state) => state.bookings.items);
const dispatch = useDispatch();
useEffect(() => { dispatch(fetchBookings(date)); }, [date, dispatch]);
<button onClick={() => dispatch(bookingCancelled(id))}>Cancel</button>
```
The whole app is wrapped in `<Provider store={store}>`.

**RTK Query: when you'd use it instead of thunks**
```js
const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  endpoints: (build) => ({
    getSlots: build.query({ query: (date) => `slots?date=${date}` }),
  }),
});
export const { useGetSlotsQuery } = api;
// in a component:
const { data, isLoading, error } = useGetSlotsQuery(date);
```
For server data, RTK Query removes most of the thunk, loading and error code above.

**Common mistakes**
- **Both mutating and returning** in a reducer: with Immer, either change `state` **or** return a new value, not both.
- Selectors that return a **new array or object** every time (`state.items.filter(...)` inside `useSelector`): the component re-renders on every store change. Use `createSelector` to cache it.
- Putting non-serialisable things (Dates, class instances, functions) in the store: RTK warns. Store ISO strings, not `Date` objects.
- Writing thunks for every API call when RTK Query would do it.

**Connected ideas**
- Reducers are pure functions, like `useReducer` (R3).
- Immer is how RTK gets immutability (R1) without you writing spread everywhere.
- RTK Query and React Query solve the same problem: server state.

**Say it**
"Redux Toolkit is the standard way to use Redux now. `configureStore` sets up the store with DevTools and thunk middleware. `createSlice` defines a piece of state and its reducers, generates the action creators, and uses Immer so I can write simple 'mutating' code safely. For async calls, `createAsyncThunk` dispatches pending, fulfilled and rejected actions that I handle in `extraReducers`. Components read with `useSelector` and change things with `useDispatch`, and I use `createSelector` to cache derived data. For server data, RTK Query generates hooks with caching and loading states, so I'd usually pick it over hand-written thunks."

---

# Part B: JavaScript

## J1. Event propagation and delegation in large apps

**Explain**
When you click an element, the event travels in **three phases**:
1. **Capture:** from the window down to the target.
2. **Target:** at the element you clicked.
3. **Bubble:** back up from the target to the window.

Listeners run in the bubble phase by default. **Delegation** uses bubbling: put **one** listener on a parent and work out which child was clicked. It uses less memory and works for elements added later.

- `event.target` is the element actually clicked; `event.currentTarget` is the element the listener is on.
- `stopPropagation()` stops the event travelling further. `preventDefault()` stops the browser's default action (following a link, submitting a form). They're different things.

**Example: one listener for a whole slot grid**
```js
grid.addEventListener("click", (e) => {
  const slot = e.target.closest("[data-slot-id]");  // works even if you clicked a span inside
  if (!slot || !grid.contains(slot)) return;
  pick(slot.dataset.slotId);
});
```

**Common mistakes**
- Using `stopPropagation` to "fix" a bug. It can silently break other features, like analytics or a "click outside to close" handler.
- Checking `e.target` directly when the slot has child elements (icons, text spans). Use `closest`.

**Connected ideas**
- React already delegates: since React 17 it attaches listeners at the root container, and your `onClick` props are handled through that.
- Capture phase: `addEventListener("click", fn, { capture: true })`.

**Say it**
"Events go down in the capture phase, hit the target, then bubble up. Delegation uses the bubble: one listener on the parent, then `event.target.closest(...)` to find which item was clicked, which also covers items added later. I only stop propagation when I really must, because it can break other listeners, and `preventDefault` is a different thing: it stops the browser's default action. React itself delegates events at the root."

---

## J2. Challenges with asynchronous programming

**Explain**
JavaScript runs one thing at a time. The **event loop** makes async work possible:
- The **call stack** runs your code now.
- When it's empty, all **microtasks** run (promise callbacks, `await` continuations).
- Then one **macrotask** (a `setTimeout` callback, an event), then microtasks again, and so on.

Main problems and fixes:
- **Callback hell** → Promises and async/await.
- **Lost errors** → `try/catch` around `await`, and `.catch()` on promises. A rejected promise with no handler is an "unhandled rejection".
- **Race conditions** (an old response arriving after a new one) → `AbortController` or ignore stale results.
- **Duplicates** (a webhook or a double-click sends twice) → make the operation **idempotent**: safe to run twice.

**Example: the order quiz**
```js
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");
// Prints: A, D, C, B. Promise callbacks (microtasks) run before timers (macrotasks).
```

**Example: cancel the old request**
```js
let controller;
async function loadSlots(date) {
  controller?.abort();                 // cancel the previous request
  controller = new AbortController();
  const res = await fetch(`/api/slots?date=${date}`, { signal: controller.signal });
  return res.json();
}
```

**Example: idempotent webhook**
```js
// Stripe can send the same event twice. Only confirm if still pending.
await db.query(
  "UPDATE bookings SET status = 'confirmed' WHERE id = $1 AND status = 'pending'",
  [bookingId]
);
```

**Common mistakes**
- Forgetting `await`: you get a Promise object instead of the data, and errors slip past your `try/catch`.
- An `async` function inside `forEach` (see J5).

**Say it**
"JavaScript is single-threaded; the event loop runs promise callbacks as microtasks before timers. The usual problems are nested callbacks, lost errors and race conditions. I use async/await with try/catch, `Promise.all` for independent calls, and AbortController to cancel stale requests. For things that can happen twice, like a Stripe webhook, I make the handler idempotent: it only confirms a booking that's still pending."

> **Likely follow-up: "Walk me through your Stripe webhook, end to end."**
> 1. **The client pays** on Stripe's checkout or payment form. Your server never sees card details.
> 2. **Stripe calls your webhook URL** (a route handler) with an event, like `checkout.session.completed` or `payment_intent.succeeded`.
> 3. **Verify it's really Stripe.** Read the **raw** request body (not parsed JSON) plus the `Stripe-Signature` header, and check them with your webhook secret. If the body is parsed and re-stringified first, the signature check fails.
> ```ts
> // app/api/stripe/webhook/route.ts
> export async function POST(req: Request) {
>   const body = await req.text();                       // raw body
>   const sig = req.headers.get("stripe-signature")!;
>   let event;
>   try {
>     event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
>   } catch {
>     return new Response("Bad signature", { status: 400 });
>   }
>   // 4. Skip duplicates: event ids are unique
>   const firstTime = await recordEventOnce(event.id);    // INSERT; unique constraint on event_id
>   if (!firstTime) return new Response("Already handled", { status: 200 });
>   // 5. Update the booking only if it's still pending
>   if (event.type === "checkout.session.completed") {
>     await confirmBookingIfPending(event.data.object.metadata.bookingId);
>   }
>   return new Response("ok", { status: 200 });          // 6. reply fast
> }
> ```
> 4. **Ignore duplicates.** Stripe can send the same event more than once. Store each `event.id` in a table with a **unique constraint**; if the insert fails, it's a repeat.
> 5. **Update safely.** Only move the booking from `pending` to `confirmed` (the `WHERE status = 'pending'` trick).
> 6. **Reply 200 quickly.** If you don't, Stripe treats it as failed and retries. Slow work (emails, SMS) can go after, or into a background job.
> 7. **Send the confirmation** email and SMS. A failure there doesn't undo the payment.
>
> Say it: "The client pays on Stripe, and Stripe calls my webhook route. I read the raw body and verify the signature with the webhook secret, so I know it's really Stripe. Then I store the event id with a unique constraint, so a repeated event is ignored, and I only move the booking from pending to confirmed. I reply 200 quickly so Stripe doesn't retry, and send the email and SMS after."

---

## J3. How closures help with modularity and encapsulation

**Explain**
A **closure** is a function plus the variables around where it was created. Even after the outer function has finished, the inner function can still read and change those variables. Nothing else can.
That gives you:
- **Private state:** variables nobody outside can touch.
- **Factories:** functions that build customised functions.
- **No global pollution:** fewer name clashes.

**Example: a private booking counter, and a factory**
```js
function createBookingCounter(limitPerDay) {
  let count = 0;                          // private: only these functions can see it
  return {
    tryBook() {
      if (count >= limitPerDay) return false;
      count++;
      return true;
    },
    remaining: () => limitPerDay - count,
  };
}
const lashDay = createBookingCounter(8);
lashDay.tryBook();       // true
lashDay.count;           // undefined: it's private
```

**Common mistake: stale closures in React**
A function created in one render "remembers" that render's values. If it runs later (an interval, a delayed callback), it sees old values. Fix with the updater form `setX(x => x + 1)`, a ref, or correct effect dependencies (see R2).

**Connected ideas**
- Every React component render creates new closures; that's why R4 talks about stable functions.
- Before ES modules, the "module pattern" used closures to make private code. Now modules give each file its own scope (J10).
- `debounce`, `once` and `memoize` (J8, J9) all work because of closures.

**Say it**
"A closure is a function that remembers the variables from where it was created, even after that outer function has finished. That lets me keep state private: only the functions I return can change it, and nothing leaks into the global scope. For example, a booking counter whose count can only change through `tryBook`. The thing to watch in React is stale closures: a callback seeing old state, which I fix with the updater form or correct dependencies."

---

## J4. Managing memory leaks when attaching events to DOM nodes

**Explain**
JavaScript frees memory automatically (**garbage collection**) once nothing references an object. A **leak** is when something still references what you no longer need, so it's never freed. Common causes:
- Event listeners never removed (especially on `window` or `document`).
- Timers (`setInterval`) never cleared.
- **Detached DOM nodes:** removed from the page but still referenced in a variable or array.
- Caches (plain objects or Maps) that grow forever.

Fixes:
- Remove listeners and clear timers in cleanup.
- `AbortController`: one `abort()` removes every listener added with its `signal`.
- `WeakMap`/`WeakSet` for data attached to DOM nodes: they don't stop garbage collection.
- Check with Chrome DevTools: the **Memory** tab (heap snapshots, look for "Detached" nodes) and `getEventListeners(el)` in the console.

**Example**
```jsx
useEffect(() => {
  const controller = new AbortController();
  const { signal } = controller;
  window.addEventListener("resize", onResize, { signal });
  window.addEventListener("keydown", onKey, { signal });
  const id = setInterval(refreshSlots, 30_000);
  return () => {
    controller.abort();     // removes both listeners
    clearInterval(id);
  };
}, []);
```

**Common mistake**
```js
window.removeEventListener("resize", () => onResize()); // does nothing
```
That's a *new* function, not the one you added. You must pass the same function reference, or use `AbortController`.

**Connected ideas**
- This is references again (R1): removal works by identity.
- Strict Mode's double effect run in development shows missing cleanup quickly.

**Say it**
"Leaks happen when something still references what we no longer need: listeners that were never removed, intervals never cleared, removed DOM nodes still held in variables, or caches that only grow. I clean up in the effect's cleanup, often with one AbortController for all listeners, use WeakMap for data tied to DOM nodes, and check with DevTools heap snapshots for detached nodes."

---

## J5. Controlling execution order in async workflows

**Explain**
- **In order (sequential):** `await` one after another when each step needs the previous result.
- **At the same time (parallel):**
  - `Promise.all([...])` waits for all; **fails fast** if any fails.
  - `Promise.allSettled([...])` waits for all and tells you which succeeded and which failed.
  - `Promise.race([...])` gives the first to finish (success or failure). Good for timeouts.
  - `Promise.any([...])` gives the first **success**.
- **Limited parallel:** run a few at a time (e.g. 5 emails at once) with a small queue or a library like `p-limit`.

**Example: a real booking flow**
```js
async function confirmBooking(input) {
  const booking = await createBooking(input);          // 1. must happen first
  const payment = await chargeDeposit(booking);        // 2. needs booking.id
  // 3 and 4 don't depend on each other: run together
  const results = await Promise.allSettled([
    sendEmail(booking),
    sendSms(booking),
  ]);
  // One failing message shouldn't undo a paid booking
  results.filter((r) => r.status === "rejected").forEach((r) => log(r.reason));
  return { booking, payment };
}
```

**Common mistake: `async` inside `forEach`**
```js
bookings.forEach(async (b) => { await sendReminder(b); });
console.log("done"); // runs BEFORE the reminders finish; forEach doesn't wait
// Fix, in order:
for (const b of bookings) await sendReminder(b);
// Fix, in parallel:
await Promise.all(bookings.map(sendReminder));
```

**Connected ideas**
- A timeout with `Promise.race([fetchSlots(), timeout(5000)])`.
- Sequential `await`s that don't depend on each other waste time: run them in parallel.

**Say it**
"If a step needs the previous result, I await in order: create the booking, then charge the deposit. Independent steps run in parallel: `Promise.all` if any failure should stop everything, `Promise.allSettled` if I need every result, like sending the email and the SMS where one failing shouldn't undo a paid booking. And I never put async functions in `forEach`, because it doesn't wait; I use `for...of` or `Promise.all` with `map`."

> **Likely follow-up: "What if the deposit charge fails after the booking is created?"**
> The problem: the booking exists, but nobody paid. You can't leave the slot blocked forever, and two people mustn't get the same slot.
> 1. **Create the booking as `pending`** with an **expiry time** (for example 15 minutes). The slot is *held*, not confirmed.
> 2. **Prevent double booking in the database**, not just in code: a unique constraint (or a check inside a transaction) so two pending or confirmed bookings can't take the same staff member and start time.
> 3. **Take the payment.** When it succeeds, the webhook (above) moves the booking to `confirmed`.
> 4. **If payment fails or the client leaves,** the booking stays `pending`. A scheduled job (or a check when slots are loaded) marks expired pending bookings as `expired`, which frees the slot.
> 5. **Retries are safe** because creating the payment uses an **idempotency key** (for example the booking id), so a retry can't charge twice.
>
> Say it: "I create the booking as pending with an expiry, so the slot is held but not confirmed, and the database itself prevents two bookings taking the same slot. The payment webhook confirms it. If payment fails or the client leaves, a scheduled job expires the pending booking and frees the slot. Payment creation uses an idempotency key, so retrying can never charge twice."

---

## J6. Hoisting and scoping

**Explain**
Before running, JavaScript sets up each scope and "registers" its declarations. That's **hoisting**:
- `var` is hoisted and set to `undefined`. Using it early gives `undefined`, no error.
- `let` and `const` are hoisted but **not initialised**. Using them before their line throws an error. That gap is the **Temporal Dead Zone (TDZ)**.
- **Function declarations** (`function book() {}`) are fully hoisted: you can call them before they appear.
- **Function expressions and arrows** (`const book = () => {}`) follow `const` rules: not usable before the line.

Scope: `var` is **function-scoped**; `let`/`const` are **block-scoped** (they live inside the nearest `{ }`).

**Example: the classic loop bug**
```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));  // 3, 3, 3
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i));  // 0, 1, 2
```
With `var` there's one shared `i`, and by the time the timers run, it's 3. With `let`, each loop round gets its own `i`, so each closure keeps its own value.

**Example: TDZ**
```js
console.log(price); // ReferenceError: Cannot access 'price' before initialization
const price = 50;
```

**Common mistake**
Calling an arrow function before it's defined because "functions are hoisted". Only *declarations* are.

**Connected ideas**
- Closures (J3) explain the loop result: each `setTimeout` callback closes over a variable.
- `const` means the *variable* can't be reassigned, not that the object can't change: `const b = {}; b.x = 1` works.

**Say it**
"Declarations are registered before code runs. `var` becomes `undefined` early, so mistakes fail silently. `let` and `const` throw if used early, the Temporal Dead Zone, which is safer. Function declarations can be called before they appear; arrow functions can't. The classic bug is `var` in a loop with `setTimeout` printing 3, 3, 3, because there's one shared variable; with `let` each round gets its own. So I use `const` by default and `let` when I must reassign."

---

## J7. Preventing callback hell and improving readability

**Explain**
**Callback hell** is when each async step is nested inside the previous one's callback, forming a "pyramid". It's hard to read, and error handling gets repeated at every level.
Fixes:
1. **async/await:** the code reads top to bottom like normal steps.
2. **Small named functions:** each step does one thing and has a clear name.
3. **One place for errors:** a single `try/catch` around the flow.
4. **Parallel where possible:** `Promise.all` instead of nesting independent calls.
5. Convert old callback APIs to promises (`util.promisify` in Node).

**Example: before and after**
```js
// Before: callback pyramid
getClient(id, (err, client) => {
  if (err) return fail(err);
  getSlots(client, (err, slots) => {
    if (err) return fail(err);
    reserve(slots[0], (err, booking) => {
      if (err) return fail(err);
      sendEmail(booking, (err) => { if (err) return fail(err); done(); });
    });
  });
});

// After: async/await
async function bookFirstSlot(id) {
  try {
    const client = await getClient(id);
    const slots = await getSlots(client);
    const booking = await reserve(slots[0]);
    await sendEmail(booking);
  } catch (err) {
    fail(err);
  }
}
```

**Common mistake**
Mixing styles: `.then()` chains and `await` in the same function. Pick one.

**Connected ideas**
- `await` is just nicer syntax over promises; error handling works the same way.
- J5 covers ordering; J2 covers what happens underneath.

**Say it**
"Callback hell is nested callbacks forming a pyramid with error checks at every level. I flatten it with async/await so it reads like steps, pull each step into a small named function, handle errors in one try/catch, and run independent calls together with `Promise.all`. Old callback APIs I wrap as promises."

---

## J8. Throttling and debouncing high-frequency events

**Explain**
Some events fire many times a second: typing, scrolling, resizing, mouse moves. Running heavy work on each one makes the page slow.
- **Debounce:** wait until the events **stop** for X ms, then run once. Like a lift door: it only closes when people stop walking in. Use for search-as-you-type and autosave.
- **Throttle:** run **at most once every** X ms while events keep coming. Like a tap that drips steadily. Use for scroll position and resize.
- Options: **leading** (run at the start) and **trailing** (run at the end). lodash's `debounce`/`throttle` support both.

**Example**
```js
function debounce(fn, ms) {
  let timer;                                   // kept alive by a closure (J3)
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function throttle(fn, ms) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}

const searchClients = debounce((q) => fetch(`/api/clients?q=${q}`), 300);
input.addEventListener("input", (e) => searchClients(e.target.value));
```

**Common mistake in React**
Creating the debounced function inside the component body: every render makes a **new** one with a new timer, so it never actually debounces. Create it once (`useMemo` or `useRef`), or debounce the *value* with a `useDebounce` hook.

**Connected ideas**
- Both rely on closures to remember the timer or the last run time.
- Debounced search can still return results out of order: combine with AbortController (J2).

**Say it**
"Both limit how often a function runs. Debounce waits until the events stop, which is good for search-as-you-type, so I don't call the API on every key. Throttle runs at most once per interval while events keep firing, which is good for scroll and resize. Both use timers kept in a closure. In React I create the debounced function once, otherwise each render makes a new timer and it never debounces."

---

## J9. Advanced uses of closures in async workflows

**Explain**
Closures let async helpers **remember things between calls**:
- **Memoization:** cache results so the same request isn't made twice. Cache the *promise*, so two callers at the same time share one request.
- **`once`:** make something run only once, like initialising a payment SDK.
- **Retry with backoff:** remember attempts left, and wait longer each time.
- **Latest-only:** ignore responses that aren't from the most recent call.

**Example: memoize, but don't cache failures**
```js
function memoizeAsync(fn) {
  const cache = new Map();
  return (key) => {
    if (!cache.has(key)) {
      const p = fn(key).catch((err) => {
        cache.delete(key);   // let the next call try again
        throw err;
      });
      cache.set(key, p);     // store the promise, so parallel callers share it
    }
    return cache.get(key);
  };
}
const getServiceDetails = memoizeAsync((id) => fetch(`/api/services/${id}`).then((r) => r.json()));
```

**Example: retry with backoff**
```js
async function withRetry(fn, attempts = 3, delay = 500) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts) throw err;
      await new Promise((r) => setTimeout(r, delay * 2 ** (i - 1))); // 500, 1000, 2000 ms
    }
  }
}
```

**Common mistakes**
- Caching a failed promise forever (fixed above).
- Retrying things that aren't safe to repeat, like charging a card. Only retry idempotent operations, or use an **idempotency key** (Stripe supports these).

**Connected ideas**
- Debounce (J8) and memoize are both "closures holding state".
- An unlimited cache is a memory leak (J4). Add a size limit or an expiry.

**Say it**
"Closures let async helpers keep state between calls. I use them for memoizing requests, where I cache the promise so parallel callers share one request and remove it if it fails; for `once`, like initialising an SDK; for retry with backoff, remembering attempts left; and for 'latest response only' wrappers. The rule is: only retry operations that are safe to repeat, and for payments use an idempotency key."

---

## J10. Scope management with modules and block scoping

**Explain**
- **ES modules** (`import`/`export`): each file has its own scope. Nothing is global unless you export it and someone imports it.
- A module is **evaluated once**. Every file that imports it gets the same instance. That's why a module can hold a shared database connection or config (a "singleton").
- Imports are **live bindings**: if the exporting module updates an exported `let`, importers see the new value. And they're read-only from the outside.
- **Block scope:** `let`/`const` live inside `{ }` (if, for, any block). `var` ignores blocks and lives in the whole function.
- **Tree shaking:** because `import`/`export` are static, bundlers can drop exports nobody uses.
- **CommonJS** (`require`, `module.exports`) is Node's older system. You'll still see it in older packages.
- **Top-level `await`** works in ES modules.

**Example**
```js
// db.js: evaluated once, shared by every importer
import { Pool } from "pg";
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// bookings.js
import { pool } from "./db.js";
export async function listBookings() {
  const { rows } = await pool.query("SELECT * FROM bookings");
  return rows;
}

// block scope
if (isPeakHour) {
  const surcharge = 10;   // only exists inside this block
}
// surcharge is not defined here
```

**Common mistakes**
- Circular imports (A imports B, B imports A) can give `undefined` at startup. Big barrel files make this easier to cause (R6).
- Accidental globals: assigning to an undeclared variable in non-strict code creates a global. ES modules run in strict mode, which throws instead.

**Connected ideas**
- Module scope replaced the old closure-based "module pattern" (J3).
- In Next.js, `'use client'` and `'use server'` at the top of a module decide where its code runs.

**Say it**
"Each ES module has its own scope, so nothing is global unless it's exported and imported, and a module is evaluated once, so it can hold shared things like a database pool. `let` and `const` are block-scoped while `var` is function-scoped, so I use `const` by default. Static imports also let the bundler tree-shake unused code. The things I watch for are circular imports and huge barrel files."

---

## J11. `this` and binding

**Explain**
`this` is **decided by how a function is called**, not where it's written. Five rules, checked in this order:

| How it's called | What `this` is | Example |
|---|---|---|
| With `new` | the brand-new object | `new Booking()` |
| With `call`, `apply` or `bind` | whatever you pass in | `fn.call(booking)` |
| As a method: `obj.fn()` | the object before the dot | `booking.confirm()` gives `booking` |
| Plain call: `fn()` | `undefined` in strict mode or modules (the global object in old sloppy code) | `const f = booking.confirm; f()` |
| **Arrow function** | **no own `this`**: it uses the `this` from the surrounding code | `() => this.status` |

**`call`, `apply`, `bind`**
- `fn.call(obj, a, b)`: run now, with `this = obj`, arguments listed one by one.
- `fn.apply(obj, [a, b])`: run now, arguments as an array.
- `fn.bind(obj)`: **don't run**: return a **new function** with `this` locked to `obj`. Useful for callbacks.

**Example: losing `this`**
```js
const booking = {
  status: "pending",
  confirm() { this.status = "confirmed"; },
};

booking.confirm();                 // works: this = booking

const fn = booking.confirm;
fn();                              // TypeError: this is undefined (strict mode)

button.addEventListener("click", booking.confirm);  // this = the button, not booking!

// Fixes:
button.addEventListener("click", booking.confirm.bind(booking));
button.addEventListener("click", () => booking.confirm());
```
Passing `booking.confirm` hands over **just the function**. The "object before the dot" is lost, so `this` changes.

**Arrow functions and `this`**
```js
const timer = {
  seconds: 0,
  start() {
    setInterval(() => { this.seconds++; }, 1000);  // arrow: uses start()'s this = timer
    // setInterval(function () { this.seconds++; }, 1000);  // normal function: this is wrong
  },
};
```
But don't use an arrow as an **object method**: `{ confirm: () => { this.status = "x"; } }`. The arrow takes `this` from outside the object, not the object.

**In React (older class components)**
```jsx
class PayButton extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);  // old way: bind in the constructor
  }
  handleClick() { this.props.onPay(); }
  // modern class syntax: handleClick = () => { this.props.onPay(); };
  render() { return <button onClick={this.handleClick}>Pay</button>; }
}
```
Function components with hooks avoid this problem completely: there's no `this`.

**Common mistakes**
- Passing a method as a callback (`setTimeout(obj.method, 100)`) and losing `this`.
- Arrow functions as object methods.
- Calling `bind` inside `render`: it creates a new function on every render.

**Connected ideas**
- Closures (J3) vs `this`: closures capture **variables** where the function is written; `this` depends on **how it's called**. Arrows make `this` behave like a closure variable.
- `bind` returns a new function, so `removeEventListener(fn.bind(x))` won't remove anything (same issue as J4).

**Say it**
"`this` depends on how a function is called. With `new` it's the new object; with `call`, `apply` or `bind` it's what you pass; called as `obj.method()` it's `obj`; a plain call gives `undefined` in strict mode. Arrow functions don't have their own `this`; they use the surrounding one. `call` and `apply` run the function straight away, with arguments listed or as an array, while `bind` returns a new function with `this` fixed, which is useful for callbacks. The classic bug is passing `obj.method` as a callback and losing `this`; I fix it with `bind` or an arrow function."

---

## J12. Prototypes and classes

**Explain**
- Every object has a hidden link to another object, its **prototype**. When you read a property that isn't on the object, JavaScript looks at the prototype, then the prototype's prototype, and so on. That's the **prototype chain**. It's how `[].map` works: `map` lives on `Array.prototype`.
- **Classes are nicer syntax over prototypes.** Methods written in a class are stored once on the prototype and shared by every instance.
- `extends` sets up the chain between classes; `super(...)` calls the parent's constructor (it must come before using `this` in the child's constructor).

**Example**
```js
class Booking {
  constructor(id) { this.id = id; this.status = "pending"; }
  confirm() { this.status = "confirmed"; }        // stored on Booking.prototype
}

class PaidBooking extends Booking {
  constructor(id, amount) {
    super(id);                                     // runs Booking's constructor first
    this.amount = amount;
  }
}

const b = new PaidBooking("b1", 5000);
b.confirm();                                       // found on Booking.prototype via the chain
Object.getPrototypeOf(b) === PaidBooking.prototype;  // true
b instanceof Booking;                                // true
```

**The same thing in the older syntax** (you may be shown this)
```js
function Booking(id) { this.id = id; }             // constructor function
Booking.prototype.confirm = function () { this.status = "confirmed"; };
const b = new Booking("b1");
```

**What `new` does, step by step**
1. Creates an empty object.
2. Links its prototype to `Booking.prototype`.
3. Runs the constructor with `this` = that new object.
4. Returns the object.

**Common mistakes**
- Forgetting `super()` in a child constructor: error when using `this`.
- Calling a constructor function without `new` (old syntax): `this` is wrong.
- Thinking classes copy methods into each object. They don't; instances share them through the prototype.

**Connected ideas**
- `extends` vs `implements` in TypeScript (T2).
- Composition ("has a") is often preferred over inheritance ("is a"): a `Booking` *has* a `PaymentProvider` rather than *being* one.

**Say it**
"Every object links to a prototype, and property lookups walk up that chain, which is how arrays get `map`. Classes are syntax over this: methods live once on the prototype and are shared by every instance. `extends` links the chain, and `super` runs the parent constructor. `new` creates an object, links its prototype, runs the constructor with `this` set to it, and returns it."

---

# Part C: TypeScript

From micro1 Backend interview feedback (19 Nov 2026): explain `interface` vs `type` and `implements` vs `extends` clearly.

## T1. `interface` vs `type`

| | `interface` | `type` |
|---|---|---|
| Describes object shapes | Yes | Yes |
| Unions (`"pending" \| "paid"`) | No | Yes |
| Primitives, tuples, function types | No (objects only) | Yes |
| Extending | `interface B extends A` | `type B = A & { ... }` (intersection) |
| Declaration merging (same name declared twice combines) | Yes | No (error) |

```ts
interface Booking { id: string; startsAt: Date; }
interface PaidBooking extends Booking { amountPaid: number; }

type Status = "pending" | "confirmed" | "expired";   // only a type can do this
type BookingWithStatus = Booking & { status: Status };
```
Rule of thumb: `interface` for object shapes (especially public ones others may extend), `type` for unions, combinations and everything else. Be consistent within a project.

Say it: "Both can describe objects. Interfaces are for object shapes, can extend each other, and merge if declared twice, which is how libraries let you add fields. Types can do more: unions like `'pending' | 'paid'`, tuples, function types and intersections. I use interfaces for object shapes and types for unions and combinations."

## T2. `extends` vs `implements`

- **`extends` = inherit.** A class that extends another class **gets its code** (methods, fields) and can override it. An interface can extend another interface to add fields.
- **`implements` = promise.** A class that implements an interface **gets no code**. It only promises to have those methods and fields, and TypeScript checks the promise at compile time.

```ts
interface PaymentProvider {
  charge(amountMinor: number, bookingId: string): Promise<string>;
}

class StripeProvider implements PaymentProvider {     // promise: must have charge()
  async charge(amountMinor: number, bookingId: string) {
    // call Stripe here
    return "pi_123";
  }
}

class BaseNotifier {
  log(msg: string) { console.log(msg); }
}
class SmsNotifier extends BaseNotifier {              // inherits log()
  send(to: string) { this.log(`SMS to ${to}`); }
}
```
Why it matters: with `implements`, the booking code can depend on `PaymentProvider`, not on Stripe directly, so you could swap providers or use a fake one in tests.

Say it: "`extends` inherits: the child class gets the parent's code and can override it. `implements` is a promise: the class gets no code, but TypeScript checks it has everything the interface requires. I use `implements` for things like a `PaymentProvider` interface, so the booking logic doesn't depend on Stripe directly and I can swap in a fake in tests."

## T3. `unknown` vs `any`

- `any` **switches type checking off**. Anything goes, and mistakes reach runtime.
- `unknown` means "I don't know yet": you **must check** (narrow) the value before using it. Safe for things from outside: JSON, API responses, `catch` errors.

```ts
function parseAmount(input: unknown): number {
  if (typeof input === "number") return input;
  if (typeof input === "string" && input.trim() !== "" && !isNaN(Number(input))) return Number(input);
  throw new Error("Invalid amount");
}
```

Say it: "`any` turns type checking off, so errors reach runtime. `unknown` forces me to check the value first, which is right for anything from outside, like request bodies or caught errors. I avoid `any` and use `unknown` plus narrowing or a Zod schema."

---

# Part D: Full-stack fundamentals

## F1. What happens when a user books a slot? (end to end)

This is the "explain the flow with architecture detail" skill your Backend feedback asked for. Practise it until it's smooth.

1. **Browser:** the client picks a slot and taps "Book". The form sends a request (`POST /api/bookings`, or a Next.js Server Action, which is also a POST).
2. **Network:** DNS turns the domain into an IP address; HTTPS encrypts the connection; the request reaches the host (e.g. Vercel or Cloudflare).
3. **Server route:** the handler runs:
   - **authenticates** (who is this? a session cookie);
   - **validates** the input (Zod; never trust the client);
   - checks **business rules** (is the slot still free? what's the real price, from the database?).
4. **Database (Postgres):** inside a **transaction**, insert the booking as `pending`. A **unique constraint** stops two bookings taking the same slot, even if two requests arrive at the same moment.
5. **Payment:** create a Stripe payment for the deposit, with an idempotency key. The client pays on Stripe's form.
6. **Webhook:** Stripe calls your webhook. Verify the signature, ignore duplicate events, move the booking `pending` to `confirmed`.
7. **Side effects:** send the confirmation email (e.g. Resend) and SMS. A failure here doesn't undo the booking; log it and retry.
8. **Response:** the browser shows "Booked", and the owner's dashboard shows the new booking.

**Say it:** "The client submits the form, which posts to my server. The handler authenticates, validates with Zod, and checks the slot and price from the database. In a transaction I create the booking as pending; a unique constraint prevents double booking. The deposit goes through Stripe with an idempotency key, and Stripe's webhook, after signature verification and a duplicate check, confirms the booking. Then I send the email and SMS, and failures there are retried without touching the booking."

## F2. REST and HTTP basics

| Method | Use | Safe to repeat (idempotent)? |
|---|---|---|
| `GET` | read | yes |
| `POST` | create / do an action | **no**: two POSTs can create two bookings |
| `PUT` | replace | yes |
| `PATCH` | partial update | not guaranteed |
| `DELETE` | remove | yes |

**Status codes worth knowing**
- `200` OK · `201` Created · `204` No Content
- `400` Bad Request (bad input) · `401` Unauthorized (not signed in) · `403` Forbidden (signed in, but not allowed) · `404` Not Found · `409` **Conflict** (slot already taken) · `422` validation failed · `429` Too Many Requests (rate limit)
- `500` server error · `503` service unavailable

**Common mistake:** returning `200` with `{ error: "..." }`. Use the right status code so clients and monitoring understand it.

**Say it:** "GET reads, POST creates, PUT replaces, PATCH updates part, DELETE removes. GET, PUT and DELETE are idempotent; POST isn't, which is why payments use idempotency keys. I use clear status codes: 401 when not signed in, 403 when not allowed, 409 when the slot is already taken, 422 for invalid input."

## F3. Authentication basics

- **Authentication** = who are you. **Authorization** = what are you allowed to do.
- **Sessions:** after login, the server stores a session and sends a cookie with its id. The cookie should be **`HttpOnly`** (JavaScript can't read it, which protects against XSS stealing it), **`Secure`** (HTTPS only), and **`SameSite`** (helps against CSRF).
- **JWT:** a signed token with user info inside. No server lookup needed, but hard to revoke before it expires.
- **OAuth** ("Sign in with Google"): Google confirms who the user is and your app trusts that.
- Always check authorization on the **server** for every action: "does this booking belong to this user?"

**Say it:** "Authentication is who you are, authorization is what you can do. I prefer server sessions in HttpOnly, Secure, SameSite cookies, so scripts can't read them. JWTs avoid a lookup but are hard to revoke. On a recent community app I used Google sign-in plus email verification. And every action checks permissions on the server, like whether this booking belongs to this user."

## F4. Database basics (Postgres)

- **Tables and relations:** `clients`, `services`, `bookings` with foreign keys (`bookings.client_id` → `clients.id`).
- **Index:** makes lookups fast, like a book's index. Add one on columns you filter by often (`bookings(start_at)`). Trade-off: slightly slower writes.
- **Transaction:** several changes that succeed or fail **together** (create booking + hold slot). If one fails, everything rolls back.
- **Constraints:** `NOT NULL`, `UNIQUE`, `CHECK (amount >= 0)`, foreign keys. The database enforces rules even if the code has a bug.
- **N+1 problem:** loading 50 bookings, then running 50 separate queries for each client. Fix with a `JOIN` or one query using `IN (...)`.
- **Money:** store as **integers in minor units** (pence, cents, kobo), never floats. That's how your booking-engine does it.

**Say it:** "I model data with related tables and foreign keys, add indexes on columns I filter by, and use transactions when several changes must succeed together. I let the database enforce rules with constraints, like a unique constraint against double booking. I watch for N+1 queries and fix them with joins. And money is stored as integers in minor units, never floats."

## F5. Deployment and environments

- **Environment variables** for secrets and config (`DATABASE_URL`, `STRIPE_SECRET_KEY`). Never commit them; different values for development and production.
- **CI** (GitHub Actions): on every push, run lint, type-check and tests. A red build blocks the merge.
- **Preview deployments:** each pull request gets its own URL for testing.
- **Monitoring:** error alerts (for example, errors sent to a Telegram chat), logs.

**Say it:** "Secrets live in environment variables, never in the repo. CI runs lint, types and tests on every push, so broken code can't merge. I like preview deployments for each pull request, and alerts for errors in production; for example, errors sent straight to a chat."

---

# Part E: Debugging and problem solving

## D1. Your debugging method (say it as steps)

1. **Reproduce it:** find the exact steps that cause it. If you can't reproduce it, you can't be sure you fixed it.
2. **Read the error properly:** the message, the stack trace, the line number.
3. **Narrow it down:** is it the browser, the API, or the database? Check the Network tab: did the request go out, and what came back?
4. **Form a guess and test it:** add a log or a breakpoint, change one thing at a time.
5. **Fix the cause, not the symptom.**
6. **Add a test** that would have caught it, so it can't come back.

**Tools:** browser DevTools (Console, Network, breakpoints in Sources), `console.log` and `debugger`, the VS Code debugger, server logs, `git bisect` to find which commit broke something.

**Say it:** "First I reproduce it reliably. Then I read the error and stack trace, and narrow down where it happens: browser, API or database, usually starting from the Network tab. I form one guess at a time and test it with logs or breakpoints. I fix the root cause, then add a test that would have caught it."

## D2. How to talk through a problem you haven't seen

AI interviewers score **how you think**, not just the final answer.
1. **Repeat the problem in your own words** and ask about unclear parts.
2. **Give a small example** and the expected output.
3. **Start simple** (even a slow solution), say it works, then improve it.
4. **Say the cost:** "This is O(n²) because of the nested loop; with a Map it's O(n)."
5. **Check edge cases out loud:** empty input, one item, duplicates, negatives.

---

# Part F: Coding patterns

## P0. Arrays and hashing

The micro1 Senior Frontend coding task (24 Nov 2026) was arrays and hashing ("counting" / simulation).

**The one big idea:** use a **`Map` (or object) as a lookup table**. Looking something up in a Map is O(1), so one pass through the array (O(n)) is enough, instead of nested loops (O(n²)).

**Practise in `lesson-04/`**: the task and tests are there; you write the code. Solutions are never kept in this repo.

## P1. Count how often each item appears (frequency count)
Problem: given `["lash", "brow", "lash", "nails", "lash"]`, return how many times each service was booked.
Target: O(n) time.

## P2. Find duplicates (has anything appeared before?)
Problem: return `true` if any client id appears twice (a double booking).

## P3. Group items by a key
Problem: group bookings by date.
Worth knowing: modern JavaScript has built-in `Object.groupBy` and `Map.groupBy`.

## P4. Two-sum (find a pair that adds up to a target)
Problem: given service prices and a gift-card value, find two services that add up to exactly that value. Return their indexes.
Hint to think about: for each number, what number would you need, and how could you check for it quickly?

## P5. Most frequent / top K
Problem: return the 2 most booked services.
Think about: what does sorting cost, and is there a faster way for huge inputs?

## P6. First item that appears only once
Problem: find the first client who booked exactly once.

## Simulation problems ("step through what happens")
Some tasks ask you to simulate a process: for example, "process these booking requests in order; reject any that clash with an existing booking." The usual shape:
1. Keep the current state in a structure (a `Set` of taken slots, a `Map` of counts).
2. Loop through the events in order.
3. For each one, check the state, decide, update the state, record the result.

**Common mistakes in these problems**
- Using a plain object with keys that aren't strings: object keys are always converted to strings (`1` and `"1"` become the same key). `Map` keeps the real key.
- Nested loops when a Map would do (O(n²) vs O(n)).
- Forgetting empty input, or one item.
- Sorting the input array in place (`sort` mutates; see R1).

**Say it (while coding):** "My first idea is a nested loop, which is O(n²). Instead I'll use a Map as a lookup table: one pass, O(n) time. Let me check edge cases: an empty array returns an empty result; duplicates are handled because I count them."

---

# Part G: Ownership stories

Kept **private** (they name real clients). They live in my private notes, not in this public repo. Format: STAR (Situation, Task, Action, Result) plus one line on what I learned, 60–90 seconds each.
Stories to have ready: something I built end to end · shipping under a deadline · learning something fast · a technical decision and its trade-offs · a real bug I fixed · a mistake I owned.

---

# Part H: Interview log

Every interview: what was asked, what I couldn't answer, what was added here.

| Date | Role | Asked about | Gaps | Added |
|---|---|---|---|---|
| 19 Nov 2026 | micro1 Backend | Backend workflows, idempotency, TypeScript | End-to-end flow detail; `interface` vs `type`, `implements` vs `extends` | Part C; F1; follow-ups in A and B |
| 24 Nov 2026 | micro1 Senior Frontend (JavaScript) | JS, React, Redux Toolkit; coding: arrays and hashing (counting / simulation) | `this` and binding, older JS syntax, Redux Toolkit | J11, J12, R11, Part F, `lesson-04/` |
