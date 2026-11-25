# micro1 — Software Engineer, Open Source Contributions

**Pay (from the listing):** $50–100/hr equivalent, paid per accepted task, with a weekly minimum. **Applied:** 25 Nov 2026, 21:35 WAT. **Status:** Interview pending (micro1 dashboard, 25 Nov 21:35).

**Deadline:** the interview pages say "last date to complete" **Nov 27, 08:27 pm** (Vercel) and **08:32 pm** (this role), with no time zone named. The email says each link expires 48 hours after applying (≈ 21:27 WAT on 27 Nov). **To be safe, finish both before 8:00 pm WAT on Thursday 27 Nov.**

**Before you start:** laptop on power, stable internet, mic and camera allowed, screen sharing allowed for Chrome (macOS: Privacy & Security → Screen & System Audio Recording).

**Note:** the TypeScript answers in section 2 are checked against the TypeScript handbook. They move into module 02 (TypeScript) when it's built.


**Interview:** AI interview, up to 31 min.

**Focus areas (from micro1's page):**
1. Your experience
2. **Proficiency in your strongest language** (say TypeScript)
3. **Algorithms and data structures**
4. **Software testing**

**What the work is:** features, bug fixes and refactors in existing open-source codebases; validating code; technical write-ups.

**Their preferred qualifications:**
- Expert in 2+ of Python/C++/Java/Rust/TypeScript/Go/C#
- Extensive open-source contributions
- Competitive programming and complex problem analysis
- Strong written communication
- Careful code review

**Your form answers:**
- $50/hr; Yes to 10–15+ h/week; Yes to signing within 24 h and starting within 24–48 h; Yes to per-task pay.
- Profiles: GitHub + schedule-x PR #1393.
- Languages: Python, TypeScript.
- Strongest work: private booking/payment systems; public booking-engine repo.

**Honest risk:** this overlaps the micro1 SWE interviews you didn't pass (12–17 Nov). Feedback then: explain flows end to end; `interface` vs `type`; `implements` vs `extends`; arrays and hashing. All four are covered below.

## 1. Your 2-minute intro (we write it together)

- Who you are; what you build (booking/payment systems in Next.js/TypeScript with Stripe).
- One real bug: cause → how you reproduced it → fix → the test that proves it.
- Your schedule-x PR: what the bug was, how you reproduced it, why your change is minimal.
- Don't claim "expert" or "extensive open source". Say what's true: one open PR, real production systems.

## 2. TypeScript: answers checked against the official handbook

Source pages on typescriptlang.org/docs/handbook: Everyday Types, Narrowing, Classes, More on Functions, Utility Types. I read them through the web fetcher because Chrome isn't allowed on that site.

**`type` vs `interface`**
- The key difference: a `type` can't be re-opened to add properties; an `interface` can (**declaration merging**).
- Interfaces describe object shapes only. A `type` can name anything, e.g. a union `type Id = string | number`.
- Extending: `interface B extends A` vs `type B = A & {...}` (intersection).
- The handbook says `extends` can be faster for the compiler than intersections.
- Its rule of thumb: *use `interface` until you need a `type` feature.*

**`implements` vs `extends`** (classes)
- `class Ball implements Pingable` only **checks** the class fits the interface. The handbook warns it "doesn't change the type of the class or its methods at all"; method parameters still need their own types.
- `class Derived extends Base` **inherits** the base's properties and methods. It can override them (`super.greet()`) but must stay compatible with the base.
- Visibility: `public` (default) / `protected` (subclasses can see it) / `private` (only checked at compile time; bracket access still works). `#field` is truly private at runtime.
- `abstract` classes can't be instantiated; subclasses must implement the abstract members.

**`unknown` vs `any` vs `never` vs `void`**
- `any` turns off type checking.
- `unknown` also accepts any value, but you can't use it until you narrow it. Example: `function safeParse(s: string): unknown { return JSON.parse(s) }`.
- `never`: a value that can't happen. Used for a function that always throws, or when nothing is left in a union.
- `void`: a function returns nothing. It isn't the same as `undefined`.
- Turn on `noImplicitAny`.

**Narrowing**
- Techniques: `typeof`, truthiness, `===`/`switch`, `in`, `instanceof`, assignment, control-flow analysis, type predicates (`function isFish(p): p is Fish`), assertion functions.
- **Discriminated unions:** all members share a literal `kind` field.
- **Exhaustiveness check:** in the `default:` branch write `const _x: never = shape;`. A new union member then becomes a compile error.

**Generics with constraints**
- Example: `function longest<T extends { length: number }>(a: T, b: T)`. The constraint is what allows `.length`.

**Utility types**
- `Partial`, `Required`, `Readonly`, `Record<K, V>`, `Pick`, `Omit`, `Exclude`, `Extract`, `NonNullable`, `Parameters`, `ReturnType`, `Awaited`.
- Be able to give one booking example each, e.g. `Omit<Booking, 'id'>` for a create form.

## 3. Algorithms and data structures drill list

This is standard computer science, not an API that changes, so no docs needed.

**Method for every problem:** restate it → give an example → brute force + its Big-O → improve → code → test edge cases (empty input, one item, duplicates, negatives).

**Drills**

| Area | Problems | Target |
|---|---|---|
| Hash maps (your weak spot) | Two-sum; group anagrams; first unique character; duplicate check | O(n) with a Map/Set |
| Two pointers | Valid palindrome; pair sum in a sorted array; merge two sorted arrays | — |
| Sliding window | Longest substring without repeating characters; max sum of size-k window | — |
| Stack | Valid brackets | — |
| Booking-flavoured stack/sort | Merge overlapping intervals | Sort first, O(n log n) |
| Sorting + binary search | Search in a sorted array; first index ≥ x | — |
| BFS/DFS | Number of islands; shortest path in an unweighted grid | — |
| Your domain | "Can these bookings fit?" (interval overlap); "next free slot" | — |

**Say the Big-O every time** (time and space). The interview asks for reasoning, not just code.

## 4. Software testing questions

**Test levels**
- Unit: one function in isolation.
- Integration: modules together, e.g. API + DB.
- End-to-end: the real user flow in a browser.
- Know when you'd use each, and why many fast unit tests plus a few E2E tests is common.

**Testing a bug fix**
1. Write a failing test that reproduces the bug.
2. Fix it.
3. Watch the test pass.
4. Keep it as a regression test.

**What you'd test in a booking flow** (your real domain)
- Double booking / overlapping slots
- Time zones and DST boundaries
- A failed or duplicated payment webhook (idempotency)
- Cancellation and refund rules
- Deposit vs balance amounts in minor units

**Other topics**
- Mocks/stubs vs real dependencies; flaky tests (time, randomness, network) and how to make them deterministic.
- Code review checklist: correctness, edge cases, tests included, naming, no unrelated changes, small diff.

