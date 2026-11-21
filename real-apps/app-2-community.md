# App 2: community app

Patterns from a production community app I built: members post, reply, vote, save and report; admins moderate. Written generically: no client names, code, limits or business details. See `README.md` in this folder for how Codex uses it.

Main syllabus links: B (time without a date library), C (counters, locks, keyset pages, UUIDv7, roles), D (idempotency keys), F (after-response work, alerts, cleanup), G (edge caching), H (sessions, staff 2FA, uploads, audit log), J (ranking, search, anonymous posts).

Answer order for every flow: **Trigger → Data → Processing → External services → Failure handling → Trade-off.**

## Stack
React 19 on a Vite-based Next.js-compatible framework, deployed as one Cloudflare Worker; TypeScript 7; Postgres through Drizzle and the `pg` driver via a connection pooler (Hyperdrive); Better Auth; Zod 4; TanStack Query for member data in the browser; Resend for email; object storage for photos (resized on the way out); Playwright end-to-end tests (no unit tests yet).

## 1. Time without a date library
- **Data:** instants are `timestamptz`. A "month something happened" is a plain `date`, always the first of the month, enforced by a check constraint. Durations in the app are multiples of 24 hours of elapsed time.
- **Processing:** comparisons use milliseconds or Postgres `now()`. Display uses `Intl.DateTimeFormat`. Relative times ("3 hr ago") are whole minutes between the instant and render time. Staff screens render UTC on the server and switch to the viewer's zone after hydration, which avoids a hydration mismatch.
- **Say:** "A month has no instant, so I store it as a date. Everything that happened at a moment is a timestamptz, and durations are elapsed time, so daylight saving can't shift them."
- **Gaps to check in any app like this:**
  - Validating "the current month" with `toISOString()` uses the UTC month. Near month ends, users east or west of UTC get the wrong answer. Compute the user's local month in their zone, and on the server allow up to the month in the furthest-ahead zone (UTC+14).
  - Cached HTML freezes "minutes ago". Render a `<time datetime>` and format it in the browser, or accept the lag and say so.
  - JavaScript "7 × 24 hours" vs SQL `interval '7 days'` only agree if the database session is UTC. Set the session time zone or compare in hours.
  - Daily charts in UTC days put a western evening on the next day.

## 2. Duplicate writes and counters
- **Data:** posts and replies carry a client-generated UUID; the server stores `<action>:<member>:<key>` as the primary key of an idempotency table with the saved result. Votes, memberships and saves have composite primary keys; open reports have a partial unique index. Counts live on rows.
- **Processing:** inside one transaction the server inserts the idempotency row first and ignores a conflict. A second request with the same key waits on that row until the first commits, then returns the stored result. Votes lock the post row, read the old vote, and apply the difference to the counter in the same transaction.
- **Say:** "The button's pending state is not the lock. The database is: a primary key on the idempotency key, and row locks around counters."
- **Gaps to check:**
  - A key kept only in component state dies on refresh, so a lost response plus a retry can create a duplicate. Persist the key with the draft.
  - Idempotency rows that are never deleted grow forever. Clean them up after a few days.
  - Hourly caps that "count rows, then insert" race under parallel requests. Lock the member row or use a counter row in the same transaction.

## 3. Ranking, feeds and search
- **Trending without a cron:** each event adds a weight in log space, with time since a fixed epoch built in. Sorting the stored score gives the same order as today's decayed totals, so no job rewrites rows. Removing a vote does not subtract (a deliberate trade-off).
- **Ranking-eligible votes:** whether a vote counts for ranking is decided once, from the account's age when it's cast, and stored on the vote.
- **Feeds:** cursor pages over time-ordered UUIDs, several sort tabs.
- **Search:** a generated `tsvector` (title weighted above body) with a GIN index.
- **Anonymous posts:** a display flag only; the author ID stays on the row for moderation, rate limits and "no self-votes".

## 4. Email, background work and alerts
- **Processing:** a notification row is written in the same transaction as the reply. After the response, a background task (`waitUntil`) emails people who qualify, with a per-person gap so nobody gets flooded. Auth emails use provider idempotency keys derived from a hash of the token, never the raw token. Errors are grouped by fingerprint, with alerts throttled per type. A nightly cron cleans up old error groups.
- **Gaps to check:**
  - After-response work has no retry: a failed or interrupted send is lost. Use a claim-then-send with retries, or an outbox and a job.
  - Two replies at once can both pass a "recently emailed?" check. Claim the right to send with a conditional update.
  - A cleanup job that catches its own errors looks successful, so failures wait until the next run.
  - Deleting a file after the database commit can leave orphans. Record pending deletions and let one job finish them.

## 5. Caching, auth and moderation
- **Caching:** public pages are cached at the edge for a few minutes. Anything personal (votes, joins, notifications) loads in a separate uncached request. The author's own browser bypasses the cache briefly after they post ("read your own writes").
- **Auth:** email sign-up with verification, breached-password and disposable-email checks, a honeypot and a bot challenge; Google sign-in; short staff sessions; staff roles come from an allow-list and are rewritten at each sign-in.
- **Moderation:** removal, report resolution and an audit-log row happen in one transaction; the audit log is insert-only in the app.
- **Gaps to check:**
  - A two-factor plugin that is installed but not required for staff gives no protection. Enforce it for staff roles.
  - "Insert-only in the app" is not "append-only in the database". Use a database role that can't update or delete the log.
  - An external call (for example a ban through the auth library) can't share the database transaction. Know which audit write is outside the transaction and why.
  - Re-encoded images may still carry location metadata. Check the output and strip it.
  - Don't describe a feature as live if only its table exists.

## Practice questions (answer out loud, full sentences, one real example)
1. Why is "the month it happened" a date, while everything else is a timestamp?
2. Why is there no job that recomputes trending?
3. A member clicks "helpful" twice, very fast. What happens, step by step?
4. A new account votes, then waits ten days. Does that vote start counting for ranking? Why did you design it that way?
5. How do you stop a double post without a separate idempotency service?
6. Why can a cached page never show one member's votes to another member?
7. What happens if the email provider is down when someone replies?
8. How do you keep an audit trail when one action uses its own connection?
9. How can an anonymous post still be moderated?
10. Daylight saving just started. What breaks, and what doesn't?
