# App 1: studio booking app

Patterns from a production booking app I built for a studio (services, deposits, balances, reminders, staff admin). Written generically: no client names, code, prices or business details. See `README.md` in this folder for how Codex uses it.

Main syllabus links: B (time), C (double booking, snapshots, money), D and E (idempotency, payments), F (jobs, reminders, outbox), G3 (Redis holds), H (auth, signed links, leaky endpoints), K (testing time and concurrency).

Answer order for every flow: **Trigger → Data → Processing → External services → Failure handling → Trade-off.**

## Stack
Next.js + React, PostgreSQL through Prisma, Better Auth (Google sign-in, allow-listed staff), Stripe Checkout and PayPal, Upstash Redis (slot holds, rate limits), Resend (email), Inngest (background jobs), Google Calendar API, Cloudinary (images), an AI chat with a keyword fallback.

## 1. Dates and time zones
- **Library:** date-fns with `@date-fns/tz`. Its zoned date type turns a wall-clock time in the studio's zone into a real instant. (Temporal is studied in this repo, not used in that app.)
- **Data:** appointment start/end stored as UTC instants, plus the studio's IANA zone on the booking and in settings. Opening hours, breaks and blocked ranges are `HH:MM` strings meaning wall-clock time in the studio zone.
- **Processing:** slot search builds the selected day in the studio zone, steps every 30 minutes from open to close, and turns each candidate into an instant. Lead time and the 24-hour reminder use real elapsed time. Emails and pages format instants back into the studio zone. `.ics` files use UTC so calendar apps show the viewer's local time.
- **Say:** "I store instants in UTC and the business's zone separately. Wall-clock rules like opening hours are converted to instants in the business's zone, and I only compare instants."
- **Gaps to check in any booking app:**
  - Every "today" must be the business's day, not the browser's or the server's. Watch calendar widgets, free/busy queries and cron jobs (a cron with no zone runs in UTC).
  - No hardcoded zones. Read the zone from one setting.
  - Test the DST missing hour and repeated hour, and decide whether those slots are hidden.

## 2. Booking and double-booking prevention
- **Data:** the booking copies price, deposit and duration from the service at that moment (a snapshot), so later price edits don't change old bookings. Pending, confirmed, completed and no-show block time; cancelled doesn't.
- **Processing, three layers:**
  1. A Redis hold on the chosen start time for one browser session (about 10 minutes, longer when a form must be filled).
  2. Slot search hides other people's holds, bookings, buffers, breaks, blocked time and calendar busy time.
  3. On create, the server re-checks slots, then checks for overlap and inserts inside a transaction.
- **Say:** "The Redis hold is a courtesy lock for the user experience. The database is the source of truth."
- **Gaps to check in any booking app:**
  - An overlap check followed by an insert is not atomic under read-committed isolation. Two requests can both see the slot free. Fix: a Postgres exclusion constraint on a time range for non-cancelled rows, or a transaction-scoped advisory lock per business per day, and retry or reject the loser.
  - The buffer must be applied in the write check, not only in the slot list.
  - The write path must enforce the same rules as the read path (for example category-specific minimum notice).
  - Rows with no end time (e.g. instant consultations) must not block real slots.

## 3. Payments: deposit and balance
- **Data:** money in integer cents. Each charge is a payment-attempt row: provider, purpose (deposit, balance, custom), status, pre-tax cents, tax cents, currency, unique idempotency key. A processed-webhooks table is unique on provider + event ID.
- **Processing:** deposit checkout reuses a live session or creates one with an idempotency key. The webhook verifies the signature, then in one transaction records the event ID, marks the attempt succeeded, and moves the booking to confirmed + partially/fully paid.
- **Say:** "I keep pre-tax amounts separate from tax so the balance stays honest, and the unique event ID makes webhook retries safe for the money update."
- **Gaps to check in any payments flow:**
  - If side effects (email, calendar) run after the commit and fail, a retry exits early on the stored event ID and the side effects never run. Fix: write a "side effects pending" flag in the same transaction, and let a job clear it; a retry still enqueues the job.
  - Compare the amount actually paid with the expected amount before confirming.
  - A late success webhook must not revive a cancelled booking or double-book a slot someone else took. Confirm only from pending; otherwise record the payment and alert a person.
  - Every provider must follow the same rules (tax, partial vs full payment, duplicate captures).
  - Handle failed payments, refunds and disputes, or document clearly that the business policy is non-refundable.
  - Public endpoints keyed only by a booking ID should not return personal details. Use a signed token.

## 4. Background jobs and reminders
- **Processing:** on create, a job waits about 35 minutes and cancels unpaid bookings. On confirm, a job emails client and staff, creates the calendar event, sleeps until 24 hours before, re-checks the booking, sends one reminder, and after the visit sends a balance link if money remains. Jobs are idempotent on the booking ID.
- **Gaps to check in any job system:**
  - A job that sleeps until a fixed time won't follow a reschedule. Cancel and restart the job, or re-read the stored reminder time after waking.
  - Writing the "sent" flag after sending can send twice on a crash. Know the trade-off: at-least-once vs at-most-once.
  - Catching an error inside a step hides it from retries. Only catch what you will handle.

## 5. Auth and privacy
- Staff sign in with Google; only allow-listed emails get in. Edge middleware only checks for a session cookie; pages and admin APIs re-check the session and role. Clients have no accounts.
- Client cancel links use an HMAC of the booking ID and are rejected inside the cancellation window. (Consider an expiry.)

## Practice questions (answer out loud, full sentences, one real example)
1. Where does an appointment time live, and what does the column really mean?
2. What happens to bookings and reminders on a daylight-saving change?
3. How do you stop a double booking? Where can it still fail?
4. Walk through a deposit and the later balance, including tax.
5. How do you make a Stripe webhook safe to retry? What can still go wrong?
6. What happens if the client never pays?
7. When does the reminder go out, and what happens if the visit is moved?
8. What does your calendar integration guarantee, and what happens when Google is down?
9. How do you protect client details on public payment pages?
10. Which parts of your schema were planned but not built yet, and why?
