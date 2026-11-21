# Progress

Next session: check topics 17–20, then complete `lesson-01/TASK.md` (`this`, bind, prototypes, and `Promise.allSettled`). Then teach topic 82, topic 22, and topic 23, in that order. After P6–P12, cover the new frontend interview priorities P13–P17.
Cycle: 1
Last session: 2026-11-20 — P0 refresh for topics 11–13; topic 16 taught and its practice moved to lesson-02 (Stage 2).

## Topic status
Statuses: Solid · Shaky · Not done · Taught (not checked yet)

| # | Topic | Status | Notes |
|---|---|---|---|
| 1 | Values, types, equality, truthy/falsy | Solid | Contrast ?? with \|\| (\|\| also replaces 0, "", false). == null does not catch NaN. |
| 2 | Scope: let/const/var, hoisting | Shaky | Items inside a const array/object can still change. var = function-scoped + hoisted. |
| 3 | Closures | Shaky | A returned closure CAN be called outside; it keeps access to its outer variables. |
| 4 | this, arrow functions, call/apply/bind | Not done | Reproduced the unbound-method error; still to fix it with bind and an arrow. |
| 5 | Prototypes and classes | Not done | Prototype check still to do. |
| 6 | Promises, async/await, errors | Shaky | Promise.all rejects on first failure; teach Promise.allSettled. |
| 7 | Event loop | Solid | |
| 8 | Arrays/objects, copies, immutability | Solid | |
| 9 | What TypeScript is | Shaky | Types are erased at COMPILE time; TS does not run at runtime. |
| 10 | tsc, tsconfig, strict | Not done | `pnpm exec tsc --noEmit --strict` passed for lesson-01. Re-test why strict matters. |
| 11 | Primitives, tuples, any/unknown/never/void | Shaky | Unknown validation and tuples were Solid. Re-test void, never, null, and undefined. |
| 12 | Inference vs annotations, widening | Solid | Correctly explained that an object property on a const binding can widen to string and that a union narrows the allowed values. |
| 13 | Literal, union, intersection types | Solid | Correctly explained that a union limits choices and that an intersection requires fields from both types. |
| 14 | Type aliases vs interfaces | Solid | Uses `type` for unions and tuples; uses `interface` for object shapes; understands `extends` and declaration merging. |
| 15 | Object types: optional, readonly, index signatures | Solid | Understands optional and readonly properties, flexible metadata with unknown, excess-property checks, and that compile-time checks do not validate runtime JSON. |
| 16 | Functions, overloads | Shaky | Understands numeric parameter and return types, defaults, rest parameters, and why a union can be simpler. Re-test function contracts, `null` vs `undefined`, and when overloads help. |
| 17 | Narrowing | Taught | |
| 18 | Discriminated unions, never | Taught | |
| 19 | Type predicates, assertion functions | Taught | |
| 20 | as, !, as const, satisfies | Taught | |
| 22 | Classes | Not done | Priority P4. |
| 23 | extends vs implements | Not done | Interview flagged: explain clearly. Priority P5. |
| 82 | Webhooks and payments engineering | Not done | Interview flagged. Cover event-ID deduplication, concurrent duplicates, race conditions, and transactional payment-state updates. Priority P3. |

## Open build tasks
- lesson-01 Stage 1 gaps: complete the values/scope exercise, bind and prototype work, and `Promise.allSettled` practice in `lesson-01/TASK.md`.
- lesson-02 booking events handler: the earlier brief was not saved in the repo; re-issue it for topics 18–20.
- lesson-06 Stripe webhook exercise: add the event-ID deduplication, concurrency, and transactional payment-state task when topic 82 begins.
- lesson-05 frontend exercises: add the five build tasks for P13–P17 when those priorities begin.

## Interview feedback to train against
- Explain flows end to end with architecture detail: database schema, scheduling mechanism, email/payment provider integration.
- Explain interface vs type and implements vs extends clearly.
- Stripe/webhooks/idempotency questions came up in a coding interview.
- Answers are too short: practise full spoken answers with one real example.
- Source: micro1 interview feedback, Nov 2026.
- Frontend/UI: interaction states and assumptions, stacking contexts and DevTools, state architecture, React re-renders and memoization, and code review judgment.
- Software Engineer: move Stripe webhook idempotency, event-ID deduplication, race conditions, and transactional payment-state updates earlier in the priority track.

## Notes
- Facts verified 2026-11-16/18 (official docs): TS 6.0+ strict defaults true; Node 22.18+/23.6+ strips types by default (no type check, enums not supported); prefer interface by default, type when needed; satisfies checks without changing the inferred type; `as` and `!` have no runtime check.
