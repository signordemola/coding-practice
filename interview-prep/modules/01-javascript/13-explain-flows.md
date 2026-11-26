# 13. Explaining a flow end to end (with the JavaScript underneath)

Explaining flows end to end was flagged after the micro1 Backend interview (19 Nov 2026). This page is about **how to say it**: a fixed answer order, and where the JavaScript from topics 01–12 shows up inside a real flow.

**Sources:**
- The answer order comes from this repo's `real-apps/README.md` and `AGENTS.md`.
- The real flow details come from `real-apps/app-1-studio-booking.md` (my own app, written generically). **Only say what that file says you built.** If an interviewer asks about something it doesn't cover, say it's not something you built, or what you'd do.
- Stripe facts come from module 08a, section 12 (docs.stripe.com, read 25 Nov 2026).
- The JavaScript mechanics are cited in the topic pages linked below.

**Replaces:** the Stripe webhook walk-through in old guide J2 and the "deposit fails" follow-up in J5.

## The answer order (use it every time)
1. **Trigger:** what starts it (a click, a webhook, a scheduled job).
2. **Data:** what's read and written, and its shape (ids, instants in UTC, integer cents).
3. **Processing:** the steps in order, and which ones run concurrently.
4. **External services:** each call out (payment provider, email, calendar), and what happens if it's slow.
5. **Failure handling:** retries, duplicates, timeouts, partial failure.
6. **Trade-off:** one decision and what it cost.

Keep each part to one or two sentences. Name the JavaScript mechanism only where it matters ("this runs concurrently with `Promise.allSettled` so one failed email doesn't undo a paid booking").

## Flow 1: a search box that calls the API (browser JavaScript)
A generic flow, not one of my apps. It's a good way to show topics 05, 06, 11 and 12 together.

- **Trigger:** an `input` event on the search box. One listener (topic 11).
- **Data:** the query string; results as an array of plain objects.
- **Processing:**
  1. The listener calls a **debounced** search (topic 12), so nothing happens until typing pauses for about 300 ms.
  2. The search **aborts the previous request** (topic 06), creates a new `AbortController` and calls `fetch(url, { signal })`.
  3. `await fetch(...)` pauses only this function; the page stays responsive (topic 05).
  4. When the response arrives, the continuation runs as a microtask, parses JSON and renders the list.
- **External:** the search API. Add `AbortSignal.timeout(5000)` combined with the user's signal through `AbortSignal.any` so a hung request doesn't spin forever.
- **Failure:** `AbortError` means a newer search replaced this one, so ignore it silently. `TimeoutError` shows "taking too long, try again". Other errors show a message and keep the old results.
- **Trade-off:** debouncing adds a small delay before the first result, in exchange for far fewer requests and no flicker.

## Flow 2: a deposit payment confirmed by a webhook (from my booking app)
Source: `real-apps/app-1-studio-booking.md` sections 2–4. Stripe details: module 08a section 12.

- **Trigger:** the payment provider calls the webhook route after the client pays on its hosted checkout page.
- **Data:** a payment-attempt row (provider, purpose, status, pre-tax cents, tax cents, currency, a unique idempotency key) and a processed-webhooks table, **unique on provider + event ID**. Money in integer cents.
- **Processing:**
  1. Read the **raw** body (`await request.text()`). Parsing it first would break the signature check.
  2. Verify the signature with the endpoint's signing secret. Invalid → 400.
  3. In **one database transaction**: record the event ID, mark the attempt succeeded, and move the booking to confirmed with its payment status.
  4. Reply **2xx quickly**, before slow work.
- **External:** confirmation emails and the calendar event run in a background job after the commit, so a slow email provider can't delay the reply.
- **Failure:**
  - The provider **retries** (up to 3 days in live mode) and can send an event **twice** or **out of order**. A repeat fails the unique constraint on the event ID, so the money update happens once.
  - The checkout itself is created with an **idempotency key**, so a retried "create checkout" can't charge twice.
  - A gap I'd name honestly (from the real-apps notes): if side effects fail after the commit, a retry stops early at the stored event ID and the side effects never run. The fix is a "side effects pending" flag written in the same transaction, cleared by a job.
- **Trade-off** (my framing: check it matches what you built before saying it): confirming from the verified webhook rather than from the browser's return page can take a moment longer to show "confirmed", but a signed server-to-server event is a signal the client can't fake.

Where the JavaScript shows up: `await` for each I/O step inside `try/catch` (topic 06); returning a response quickly while slow work is queued elsewhere (topic 05); integer cents (topic 01).

## Flow 3: what if the client never pays? (from my booking app)
Source: `real-apps/app-1-studio-booking.md` sections 2 and 4.
- **Trigger:** the booking is created, before payment.
- **Data:** the booking starts as **pending**, which blocks the time. A short Redis hold protects the chosen slot while the client fills in the form (a courtesy lock); the database is the source of truth.
- **Processing:** on create, a background job waits about 35 minutes and cancels the booking if it's still unpaid, which frees the slot. Jobs are idempotent on the booking ID.
- **Failure:** a late payment webhook must not revive a cancelled booking or take a slot someone else has since booked: only confirm from pending; otherwise record the payment and alert a person (a "gap to check" in the notes).
- **Trade-off:** holding the slot while pending prevents double booking during checkout, but an abandoned checkout blocks the slot until the job runs.

## How to answer the follow-ups
- **"What if two requests arrive at once?"** Name the shared state and where it's protected (a database constraint or transaction, not application code alone). JavaScript's run-to-completion only protects one process's memory; two server instances or two requests awaiting I/O can still interleave between `await`s (my reasoning from topic 05: other jobs run while an `await` is pending).
- **"What if the external service is down?"** Timeouts on the call, retries only if the operation is safe to repeat, and what the user sees meanwhile.
- **"What would you change?"** Pick a real gap from the real-apps notes and say: the gap, why it exists, the risk, the fix.

## Practice (out loud, scored with the 0–7 rubric in `AGENTS.md`)
1. Walk me through Flow 2 without notes, in the six-part order. Then: "What happens if the same event arrives twice?"
2. Walk me through Flow 1. Then: "Why debounce *and* abort? Isn't one enough?"
   (Debounce cuts how many requests start; abort handles a slow earlier request finishing after a newer one. They solve different problems.)
3. "Your server got two webhook events for the same payment at the same moment. Can both update the booking?"
   (My reasoning, check it against module 06 SQL when it's built: not if the event-ID insert and the update are in one transaction with a unique constraint. The second insert fails and that transaction rolls back. Without the constraint, both could pass an "already processed?" check, since each awaits the database and the other request runs in between.)
4. Pick one flow from `real-apps/app-2-community.md` and explain it in the same order.

## Say it: the 20-second version of Flow 2
"The client pays on the provider's hosted page, and the provider calls my webhook. I read the raw body, verify the signature, then in one transaction I record the event ID, which is unique, mark the payment succeeded and confirm the booking, and I reply 200 straight away. Emails and the calendar event run in a background job. Retries and duplicates are safe because a repeated event ID fails the unique constraint, and checkout creation uses an idempotency key so it can't charge twice."
