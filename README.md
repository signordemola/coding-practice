# coding-practice

TypeScript practice for understanding real-world apps: time zones, payments, concurrency, background jobs, debugging and open-source fixes. The plan is in [`SYLLABUS.md`](SYLLABUS.md); the real-app patterns it builds on are in [`real-apps/`](real-apps/).

## Lessons

| Folder | Track | Exercises and current coverage |
| --- | --- | --- |
| 01 | A: JavaScript core | [`deposit.ts`](lesson-01/deposit.ts), [`fetch-bookings.ts`](lesson-01/fetch-bookings.ts), [`event-loop.ts`](lesson-01/event-loop.ts), [`TASK.md`](lesson-01/TASK.md). Covers parts of topics 3, 4, and 6–8. The task fills gaps in topics 1, 2, 4, 5, and 6. |
| 02 | A: TypeScript basics | [`booking-payload.ts`](lesson-02/booking-payload.ts), [`booking-functions.ts`](lesson-02/booking-functions.ts), [`stage-2-coverage.md`](lesson-02/stage-2-coverage.md). Coverage and gaps are listed in the stage map. |

The examples use booking data: prices, deposits and balances.

## Run a lesson

You need Node.js 24 or later. It runs TypeScript files directly.

Install the shared tools once from the repository root:

```bash
pnpm install
```

Run a lesson from the repository root:

```bash
node lesson-01/deposit.ts
node lesson-01/event-loop.ts
node lesson-01/fetch-bookings.ts
node lesson-02/booking-payload.ts
node lesson-02/booking-functions.ts
```

Type-check a lesson from the repository root:

```bash
pnpm exec tsc --noEmit --strict lesson-02/booking-functions.ts
```

## Status

Syllabus rebuilt around tracks and real-world debugging (Nov 2026). Track A is in progress; Track B (time) and Track R (debugging) are next.

---

Built by [Adedamola](https://github.com/signordemola) · [Demola Studio](https://www.demolastudio.com)
