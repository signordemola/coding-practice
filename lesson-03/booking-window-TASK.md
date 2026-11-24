# Bug hunt: booking window (Track R + B)

`booking-window.ts` is "in production" for a studio in New York with clients across North America. Its tests pass. Two support tickets came in this week.

**Ticket 1, from the studio owner:** "The daily report is wrong. Last Tuesday's 9:30pm booking showed up under Wednesday, and Wednesday's report had one too many."

**Ticket 2, from a client in Los Angeles:** "At about 8pm on 31 March I tried to book a late slot that same evening, and the booking page said March wasn't available any more. April worked fine."

## Rules
- 25 minutes before asking for any hint. Codex gives hints one level at a time (see `AGENTS.md`).
- **Reproduce first:** for each ticket, write a failing test in the "your reproductions" block of `booking-window.test.ts`, using the exact situation in the ticket. Don't touch `booking-window.ts` until both tests fail for the right reason.
- **Root cause in one sentence** per ticket, written in your notes before you change code.
- **Smallest correct fix.** Keep every existing test passing. Don't refactor unrelated code.

## Done when
- Both reproduction tests fail before your fix and pass after it; all existing tests still pass.
- You can tell each bug as a bug story in under 2 minutes: symptom → reproduction → hypothesis → evidence → root cause → fix → test → prevention.
- You've written one line on where the same class of bug could hide in a real booking app (search `real-apps/` for ideas).

## Verify
```bash
pnpm typecheck
node --test lesson-03/booking-window.test.ts
```
