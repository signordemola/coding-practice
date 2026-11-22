# Progress

Next session: start Track B with `lesson-b-time/`. Order: Part 0 (predict.ts) → B1–B2 taught PRIMM-style → slots Parts 1–2. Track A: check A17 (narrowing). Review queue: A16, A11. Track R this week: the `booking-window` bug hunt, then R1 with the first code-reading drill. Still open: `lesson-01/a1-a8-gaps-TASK.md`.
Cycle: 1
Last session: 2026-11-20 — P0 refresh for topics 11–13; topic 16 taught and its practice moved to lesson-02 (Stage 2).

## Module status
Statuses: Solid · Shaky · Not done · Taught (not checked yet). Track A IDs keep the old topic numbers. Modules not listed are Not done.

| ID | Module | Status | Notes |
|---|---|---|---|
| A1 | Values, types, equality, truthy/falsy | Solid | Contrast ?? with \|\| (\|\| also replaces 0, "", false). == null does not catch NaN. |
| A2 | Scope: let/const/var, hoisting | Shaky | Items inside a const array/object can still change. var = function-scoped + hoisted. |
| A3 | Closures | Shaky | A returned closure CAN be called outside; it keeps access to its outer variables. |
| A4 | this, arrow functions, call/apply/bind | Not done | Reproduced the unbound-method error; still to fix it with bind and an arrow. |
| A5 | Prototypes and classes | Not done | Prototype check still to do. |
| A6 | Promises, async/await, errors | Shaky | Promise.all rejects on first failure; teach Promise.allSettled. |
| A7 | Event loop | Solid | |
| A8 | Arrays/objects, copies, immutability | Solid | |
| A9 | What TypeScript is | Shaky | Types are erased at COMPILE time; TS does not run at runtime. |
| A10 | tsc, tsconfig, strict | Not done | `pnpm exec tsc --noEmit --strict` passed for lesson-01. Re-test why strict matters. |
| A11 | Primitives, tuples, any/unknown/never/void | Shaky | Unknown validation and tuples were Solid. Re-test void, never, null, and undefined. |
| A12 | Inference vs annotations, widening | Solid | Correctly explained that an object property on a const binding can widen to string and that a union narrows the allowed values. |
| A13 | Literal, union, intersection types | Solid | Correctly explained that a union limits choices and that an intersection requires fields from both types. |
| A14 | Type aliases vs interfaces | Solid | Uses `type` for unions and tuples; uses `interface` for object shapes; understands `extends` and declaration merging. |
| A15 | Object types: optional, readonly, index signatures | Solid | Understands optional and readonly properties, flexible metadata with unknown, excess-property checks, and that compile-time checks do not validate runtime JSON. |
| A16 | Functions, overloads | Shaky | Understands numeric parameter and return types, defaults, rest parameters, and why a union can be simpler. Re-test function contracts, `null` vs `undefined`, and when overloads help. |
| A17 | Narrowing | Taught | |
| A18 | Discriminated unions, never | Taught | |
| A19 | Type predicates, assertion functions | Taught | |
| A20 | as, !, as const, satisfies | Taught | |
| A22 | Classes | Not done | Phase 1. |
| A23 | extends vs implements | Not done | Interview flagged: explain clearly. Phase 1. |
| B1–B8 | Time | Not done | Phase 1, first. Came up in a live interview. |
| I9–I12 | CSS and layout, styling at scale, state libraries, DOM events | Not done | Added 22 Nov from platform interview lists (Phase 3). |
| F8, G6 | Node event loop under load; APIs at scale | Not done | Added 22 Nov from platform interview lists. |
| M7–M8 | Interview bank; timed coding tests | Not done | Speak step and weekly timed drill start now. |
| E2 | Webhooks (was topic 82) | Not done | Interview flagged. Cover event-ID deduplication, concurrent duplicates, ordering, and transactional payment-state updates. |

## Review queue
Re-test from memory on or after the date. Gaps: about 1 → 3 → 7 → 21 days; back to 1 day if Shaky.

| Module | Due | Last result |
|---|---|---|
| A16 | next session | Shaky |
| A11 | next session | Shaky |
| A2, A3, A6, A9 | within the first week | Shaky |

## Level check (see Levels in `SYLLABUS.md`; updated at each weekly review)
Current level: working towards Level 1.
| Date | Evidence for the next level | Gaps |
|---|---|---|
| 2026-11-21 | One open-source PR opened (calendar library). | No exercises yet under the new hint rules; spoken answers not yet scored. |

## Help log (deepest hint rung used per exercise; it should go down over time)
| Date | Exercise | Deepest rung (0 = none, 5 = key line shown) | Time taken | Notes |
|---|---|---|---|---|

## Real-app drills
Practice questions from `real-apps/`. Grade each spoken answer.

| App | Question | Status | Notes |
|---|---|---|---|
| App 1 | Q1–Q10 | Not done | |
| App 2 | Q1–Q10 | Not done | |

## Track R log
| Date | Type (bug hunt / code reading / postmortem / OSS issue) | What | Result | Notes |
|---|---|---|---|---|
| 2026-11-21 | OSS issue | Calendar library: custom event modal didn't reposition when its size changed | PR opened | Fixed with a ResizeObserver; 3 tests added. Waiting for maintainer review. |

## Open build tasks
- lesson-01 Stage 1 gaps: complete the values/scope exercise, bind and prototype work, and `Promise.allSettled` practice in `lesson-01/a1-a8-gaps-TASK.md`.
- lesson-02 booking events handler: the earlier brief was not saved in the repo; re-issue it for A18–A20.
- `lesson-b-time/slots-TASK.md`: Parts 0–5 (ready, tests written).
- `lesson-b-time/booking-window-TASK.md`: bug hunt, two tickets (ready).
- Later in Track B: rebuild `slots` with Temporal and compare (B7).
- `lesson-e-payments/`: webhook handler for duplicate, out-of-order and concurrent events (when E2 begins).
- `lesson-i-frontend/`: the five frontend exercises for I5–I8 (when Track I begins).

## Interview bank (`interview-bank/`; see its README)
Speak step: one question per session, score 0–7; under 5 goes to the review queue. Priority: RE and JS first, then NO and BE, then AP.
| Date | Question id | Score | Missing |
|---|---|---|---|
| | | | |

## Quick checks, timed drills and practice interviews
| Date | Type (quick check / timed drill / mock / platform practice) | Topic | Result (score, time used) | Notes |
|---|---|---|---|---|
| | | | | |

## Detours (interview pull-ins only)
| Date | Interview or test | Modules pulled in | Back on the Path |
|---|---|---|---|
| | | | |

## Interview feedback to train against
- Explain flows end to end with architecture detail: database schema, scheduling mechanism, email/payment provider integration.
- Explain interface vs type and implements vs extends clearly.
- Stripe/webhooks/idempotency questions came up in a coding interview.
- Answers are too short: practise full spoken answers with one real example.
- Source: micro1 interview feedback, Nov 2026.
- Frontend/UI: interaction states and assumptions, stacking contexts and DevTools, state architecture, React re-renders and memoization, and code review judgment.
- Software Engineer: move Stripe webhook idempotency, event-ID deduplication, race conditions, and transactional payment-state updates earlier.
- Time zones, date-fns and Temporal came up in an expert-network interview (Nov 2026). My production apps use date-fns + `@date-fns/tz` and `Intl`, not Temporal: describe Temporal as what I'd use next and why.

## Notes
- Facts verified 2026-11-16/18 (official docs): TS 6.0+ strict defaults true; Node 22.18+/23.6+ strips types by default (no type check, enums not supported); prefer interface by default, type when needed; satisfies checks without changing the inferred type; `as` and `!` have no runtime check.
- Facts verified 2026-11-21: see the bottom of `SYLLABUS.md` (Temporal, Postgres 18, Stripe webhooks, Resend, Inngest, Workers).
