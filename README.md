# coding-practice

Small TypeScript exercises. Each numbered folder maps to a syllabus stage and can contain multiple exercise files.

## Lessons

| Folder | Stage | Exercises and current coverage |
| --- | --- | --- |
| 01 | Stage 1 | [`deposit.ts`](lesson-01/deposit.ts), [`fetch-bookings.ts`](lesson-01/fetch-bookings.ts), [`event-loop.ts`](lesson-01/event-loop.ts), [`TASK.md`](lesson-01/TASK.md). Covers parts of topics 3, 4, and 6–8. The task fills gaps in topics 1, 2, 4, 5, and 6. |
| 02 | Stage 2 | [`booking-payload.ts`](lesson-02/booking-payload.ts), [`booking-functions.ts`](lesson-02/booking-functions.ts), [`stage-2-coverage.md`](lesson-02/stage-2-coverage.md). Coverage and gaps are listed in the stage map. |

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

Stage 1 and Stage 2 are in progress.

---

Built by [Adedamola](https://github.com/signordemola) · [Demola Studio](https://www.demolastudio.com)
