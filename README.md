# coding-practice

Small TypeScript exercises. Each lesson is one folder with one file that prints its results.

## Lessons

| Lesson | File | Topics |
| --- | --- | --- |
| 01 | [`lesson-01/deposit.ts`](lesson-01/deposit.ts) | Closures, input validation, classes, and how a detached method loses `this` |
| 02 | [`lesson-02/fetch-bookings.ts`](lesson-02/fetch-bookings.ts) | Event loop order, promises, `async`/`await`, `Promise.all`, `filter`/`map`/`reduce`, shallow copy and `structuredClone` |
| 03 | [`lesson-03/booking-payload.ts`](lesson-03/booking-payload.ts) | `unknown`, runtime validation, tuples, literal unions, and intersections |

The examples use booking data: prices, deposits and balances.

## Run a lesson

You need Node.js 24 or later. It runs TypeScript files directly.

```bash
cd lesson-01
node deposit.ts
```

```bash
cd lesson-02
node fetch-bookings.ts
```

To use the TypeScript compiler in a lesson, install its packages first:

```bash
pnpm install
```

## Status

Three completed lessons. More will be added.

---

Built by [Adedamola](https://github.com/signordemola) · [Demola Studio](https://www.demolastudio.com)
