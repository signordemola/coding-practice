# coding-practice

TypeScript practice for understanding real-world apps: time zones, payments, concurrency, background jobs, debugging and open-source fixes. The plan is in [`SYLLABUS.md`](SYLLABUS.md); the real-app patterns it builds on are in [`real-apps/`](real-apps/).

## Lessons

| Folder | Track | Exercises and current coverage |
| --- | --- | --- |
| 01 | A: JavaScript core | [`deposit.ts`](lesson-01/deposit.ts), [`fetch-bookings.ts`](lesson-01/fetch-bookings.ts), [`event-loop.ts`](lesson-01/event-loop.ts), [`a1-a8-gaps-TASK.md`](lesson-01/a1-a8-gaps-TASK.md). Covers parts of A3, A4 and A6–A8. The task fills gaps in A1, A2, A4, A5 and A6. |
| 02 | A: TypeScript basics | [`booking-payload.ts`](lesson-02/booking-payload.ts), [`booking-functions.ts`](lesson-02/booking-functions.ts), [`coverage.md`](lesson-02/coverage.md). Coverage and gaps for A9–A23. |
| 03 | B: Time | [`predict.ts`](lesson-03/predict.ts), [`slots`](lesson-03/slots-TASK.md) (build: slots across zones, buffers, validation, DST), [`booking-window`](lesson-03/booking-window-TASK.md) (bug hunt). Tests in `*.test.ts`. |
| 04 | M8: Timed coding drill (interview pull-in) | [`arrays-hashing`](lesson-04/arrays-hashing-TASK.md) (build: counting, duplicates, grouping, two-sum, top K, first unique, simulation). |

Interview topics from platform tests, mapped to the syllabus, are in [`interview-bank/`](interview-bank/).

The examples use booking data: prices, deposits and balances.

## Run the lessons

You need Node.js 26 or later (it runs TypeScript files directly and has Temporal built in) and pnpm.

```bash
pnpm install          # once
pnpm typecheck        # strict type-check of every lesson (tsc, no output files)
pnpm test             # every *.test.ts with Node's built-in test runner
pnpm check            # both
node --test lesson-03/slots.test.ts   # one exercise
node lesson-01/deposit.ts                 # run a file
```

Build exercises mark unfinished parts as `todo`, so they're reported without failing the run. GitHub runs `pnpm check` on every push.

## Status

Syllabus rebuilt around tracks and real-world debugging (Nov 2026). Track A is in progress; Track B (time) and Track R (debugging) are next.

---

Built by [Adedamola](https://github.com/signordemola) · [Demola Studio](https://www.demolastudio.com)
