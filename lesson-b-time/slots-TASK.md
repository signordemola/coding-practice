# Slots across time zones (B1–B3)

**Goal:** build the slot generator a real booking app needs: a business in one zone, clients anywhere, correct on daylight-saving days, safe with bad input.
**Real-app link:** `real-apps/app-1-studio-booking.md` §1 (time) and §2 (booking). The same problem my production app solves with date-fns + `@date-fns/tz`.
**You write all the code.** Codex only asks questions and gives hints in order (see `AGENTS.md`).

## Rules
- Work through the parts in order. Don't read ahead into later parts' tests until you finish the current one.
- Before each part: write 2–3 lines in your notes: what you'll do and what could go wrong.
- Use any approach (built-in `Intl`, `Temporal` on Node 26+, or date-fns + `@date-fns/tz` if you install them). After Part 4, be ready to say why you chose it.
- Don't edit the given expectations in `slots.test.ts`. Add your own tests in Part 5.

## Part 0: Predict (10 minutes)
Open `predict.ts`. **Without running it**, write down what each numbered line prints (1–9). Then run `node lesson-b-time/predict.ts` and compare.
For every line you got wrong, write one sentence: what you assumed vs what's true. Lines 7 and 8 differ: explain why, and why line 8 can give a different answer on your Mac than on a server.

## Part 1: Wall-clock hours → UTC instants
Remove `{ todo: "Part 1" }` from the Part 1 block in `slots.test.ts`. Implement enough of `generateSlots` and `toViewerWallTime` to pass it.
- Opening and closing times are wall-clock times in the business's zone on `date`.
- Candidate starts go from `opensAt` in steps of `stepMinutes` (wall-clock). A slot lasts `durationMinutes` of elapsed time and must end by closing time.
- Return instants with `Date#toISOString()`.

## Part 2: Bookings, buffers, notice
Remove `{ todo: "Part 2" }`.
- A slot can't overlap any booking expanded by `bufferMinutes` on both sides. Touching (one ends exactly when the other starts) is fine.
- A slot must start at least `minNoticeMinutes` after `now`.

## Part 3: Production-ready boundaries
Remove `{ todo: "Part 3" }`. Every bad input throws a `RangeError` with a clear message: unknown zone, impossible or badly formatted date/time, closing not after opening, non-positive duration or step, negative buffer or notice, a booking that ends before it starts, an invalid `now`.

## Part 4: Daylight-saving days
Remove `{ todo: "Part 4" }`.
- Wall times that don't exist (the skipped hour) produce no slot.
- Wall times that happen twice (the repeated hour) use the **earlier** occurrence.
- Before coding, explain out loud how your approach detects each case.

## Part 5: Your own edge cases
Add at least two tests nobody gave you (ideas are in the test file). At least one should fail at first and make you change code.

## Done when
- `pnpm typecheck` passes and `node --test lesson-b-time/slots.test.ts` shows **0 todo, 0 fail**.
- You can explain, without notes, in under 2 minutes: where a booking time lives (instant vs wall time vs plain date), how you turn "09:00 in New York" into an instant, and what happens on both DST days.
- Production-ready checklist (from `AGENTS.md`) reviewed.

## Verify
```bash
pnpm typecheck
node --test lesson-b-time/slots.test.ts
```
