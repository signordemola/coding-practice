# Syllabus

Goal: become an engineer who can **understand a real app, find its edge cases, debug it, fix it, and explain it**: in my own apps, in other people's code, and in open-source projects. Every topic is tied to the real production apps described in `real-apps/`, so I can talk about my own work with confidence: what I built, why, what can go wrong, and what I'd do next.

Theory serves practice. Track R (real-world debugging and open source) is the backbone: it runs every week from the first week, and every other track feeds it.

## The goal, in my words (the north star: never drift from this)
I want to become an advanced, expert developer: someone who understands real-world apps, finds edge cases, debugs and fixes real bugs (like in open-source projects), writes production-ready code, and can talk about all of it confidently. The AI's job is to make me do the thinking, not to do it for me.

### Levels (how we know I'm getting there)
Progress is measured by what I can do **unaided**, not by topics covered. Codex checks these at every weekly review and records them in `PROGRESS.md`.
| Level | I can… | Evidence |
|---|---|---|
| 1. Solid | Build a feature from a task brief to passing tests with production-ready checks; fix planted bugs with a failing test first; explain my own two apps end to end. | Most exercises done at hint rung 0–2; spoken answers average 5/7 or more. |
| 2. Strong | Read an unfamiliar open-source codebase, reproduce and fix a real issue, and get it reviewed; design a booking system or feed out loud, including failure modes and trade-offs. | Merged open-source PRs in my domain; bug hunts solved unaided within 25 minutes; system-design answers scoring 6/7. |
| 3. Advanced / expert | Find bugs nobody planted (in open source, my apps, or code I review); spot time, concurrency, payment and security problems in other people's code; teach a topic clearly in writing. | Bugs I found and reported or fixed myself; code reviews that catch real problems; public write-ups of fixes. |

## How I learn here: I do the thinking
AI tutors help when they make the learner think and hurt when they do the work (see "Why this design" at the bottom). So Codex never writes my solutions or fixes, never debugs for me, and gives hints one rung at a time (`AGENTS.md` sections 1–2). I write the code, I debug it, I explain it.

**Time split across a week:** about 40% writing code · 35% debugging and fixing · 15% reading and predicting code · 10% explaining out loud. Tests are the referee, not the main activity: Codex writes the tests that define "done"; I write tests only to reproduce a bug before fixing it and for edge cases I spot myself.

## Lean rules (stay out of tutorial hell)
**The syllabus is frozen as of 22 Nov 2026.** No new topics. Everything else is learned by building real-world apps, fixing real bugs and contributing to open source.
1. **One main thing at a time:** one Path module, linked to my real apps, plus the short Track A module and reviews the learning loop already mixes in. No extra courses, side tracks or tutorials.
2. **Struggle first:** 15–30 minutes of my own attempts before any hint (rung 1 only after a real attempt).
3. **Stop rule:** a module is done when I can build it, debug a broken version of it, and explain it in 1–2 minutes unaided. Then move on; spaced review keeps it fresh. Covering every edge case is not the bar.
4. **Just in time:** fundamentals and edge cases come from the task, a real bug or open-source code. Never pre-listed. Modules marked "pull in only when needed" are taught only when a real task needs them.
5. **Mostly doing:** about 75–80% writing, debugging and reviewing code; the rest reading, predicting and explaining (the weekly time split above). Codex flags a week that drifts.
6. **No new modules.** If a real task, bug or interview needs something missing, teach it inside the current work. Every two weeks, skip anything unused.
7. **Rebuild after help:** any exercise where hints reached rung 4–5 is rebuilt from memory at the next session.

## The learning loop (every module)
1. **Explain first**: I say what I already know about the idea. Codex corrects gaps.
2. **Predict → Run → Investigate** (PRIMM): I predict what given code does, run it, then trace and explain the differences. New ideas get a short explanation with the official docs link.
3. **Modify → Make**: I change working code, then build the exercise: `<name>.ts` + `<name>.test.ts` + `<name>-TASK.md`, in ordered parts with tests marked `todo` until I start each part. The last part is always my own edge cases.
4. **Break and fix**: a bug hunt in the same area: reproduce with a failing test, root cause in one sentence, smallest fix.
5. **Speak**: one interview question out loud, scored 0–7: Trigger → Data → Processing → External → Failure → Trade-off (or the bug-story order). Take it from `interview-bank/` (M7), matching the module.
6. **Review later**: re-tested from memory after about 1, 3, 7 and 21 days (`PROGRESS.md` review queue). Each review also starts with a **5-question quick check**: stack-test-style multiple choice on precise details of the current track (see `interview-bank/turing.md`).

Each session mixes topics (interleaving): one main module from the Path, one Track A module, the review queue, one real-app question.

**Production-ready standard for every build** (checklist in `AGENTS.md` section 7): validated input, tested failure paths, safe retries and duplicates, timeouts, money in cents, explicit time zones, no secrets, clear names and types.

### Weekly practice rhythm (Track R)
- **1 timed coding drill** (M8): 25–45 minutes, no AI help, in my editor, talking out loud, as in real platform tests. About once a month, make it a **work simulation** instead (60–90 minutes: debug a problem, review a small change, build a small feature with tests, explain one design choice), like the Andela assessment.
- **2 bug hunts**: one of them may be swapped for a **code-review drill** (Codex writes a small pull request with planted problems; I write review comments, required change vs suggestion, then fix the worst one) or an **evaluation drill** (I turn a bug I already fixed into a gradable task: a clear brief, checks that pass any correct fix and fail wrong or hard-coded ones, my reference fix; then I grade a sample answer with a rubric and write one line per score). Otherwise, Codex writes a small, realistic file (booking, payments, feed, auth) with 1–3 planted bugs from the bug classes in `real-apps/`. I get 25 minutes before any hint: reproduce, write a failing test, fix, explain.
- **1 code-reading drill**: one flow from a real open-source repo (see R7), for example the Stripe webhook handler in `nextjs/saas-starter` or the booking-creation path in `calcom/cal.diy`. Trace it from the click or request to the database write, then write one page: what it does, what it assumes, and which failures it handles vs ignores (two requests at once, duplicate webhook, failure after the first write, job retry after partial success, runtime time limit, dropped connection).
- **1 postmortem or bug write-up**: a 5-line summary: trigger, root cause, fix, lesson, where the same bug could happen in my apps.
- **Every 2 weeks: one practice interview** on a platform that offers free unlimited practice (Mercor), explaining one of my apps end to end (M4). Log what went badly.
- **Every 2–3 weeks: one real open-source issue**: reproduce it; if it's fresh and nobody's on it, fix it and open a PR myself.

## The Path (teaching order)

### Throughout: Track R
R1–R4 in the first two weeks (reading code, reproducing, narrowing, bisecting), then R5–R9 woven into the other tracks. The weekly rhythm above never stops.

### Phase 1: what my interviews are asking now
1. **B1–B8 Time.** It came up in a live interview. My apps use date-fns + `@date-fns/tz` and `Intl`; learn Temporal as "what I'd use next and why".
2. **C1–C8 Data correctness in Postgres.** Double bookings, counters, constraints, locks.
3. **D1–D5 Idempotency and duplicates.** Both apps depend on it.
4. **E1–E7 Payments.** micro1 feedback: Stripe, webhooks, idempotency.
5. Alongside, from Track A: check A17–A20, finish A4–A5, then A22–A23 (classes, extends vs implements: flagged in an interview).

### Phase 2: reliability and safety
6. **F1–F7 Background work and reliability.**
7. **H1–H8 Auth, security and privacy.**
8. **G1–G5 Caching and performance.**

### Phase 3: product depth
9. **I1–I8 Frontend and React** (includes the frontend interview priorities: UI states, stacking, state architecture, re-renders, code review).
10. **J1–J4 Feeds, ranking and search.**
11. **K1–K6 Testing.**

### Phase 4: interview mastery
12. **M1–M6 System design and speaking**, including full mock interviews. (M7–M8 are practice formats that run all along.)
13. **N AI engineering** (for AI-training and evaluation roles; the evaluation drill in the weekly rhythm practises it all along).
14. **L Web and platform fundamentals**: pull in any module as soon as another module needs it.

After the Path: cycle 2 with harder follow-ups, prioritising Shaky topics.

**Interview pull-ins (the only allowed detour):** when a real interview or test is booked within 7 days, Codex may pull the matching `interview-bank/` questions, quick checks and modules into sessions, logs the detour in `PROGRESS.md`, and returns to the Path afterwards. New topics are never added outside this file.

---

## Track R: Real-world debugging and open source (the backbone)
Why: paid roles and interviews test whether I can work in code I didn't write. My first open-source PR (a calendar library's modal positioning bug) is the model: read the code, reproduce, fix with a test, explain.
- R1 **Reading an unfamiliar codebase**: README and CONTRIBUTING, folder map, entry points; follow one request or click end to end; search for the exact error text; read the tests and recently merged PRs; `git log` and `git blame` to learn why code is the way it is.
- R2 **Reproduce first**: exact steps, expected vs actual, a minimal reproduction, then a failing test before touching the fix. If I can't reproduce it, I don't "fix" it.
- R3 **Narrow it down**: write the suspected root cause in one sentence before changing any code; one hypothesis at a time, written down; server terminal, browser console and Network tab first; change one thing at a time; logging and tracing; the Node and browser debuggers (`node --inspect`, DevTools breakpoints); reading a stack trace from the top frame I own.
- R4 **`git bisect`**: find the commit that introduced a regression, and automate it with `git bisect run` and a test script.
- R5 **Edge-case hunting**: a checklist I run on any feature: time zones and DST, month ends, money rounding, double clicks and retries, two requests at once, empty/huge/unicode input, permissions and other people's IDs, stale caches, slow or failing third-party services.
- R6 **Fix well**: the smallest correct change; a test that fails before and passes after; check what else calls the code; no drive-by refactors in the same PR.
- R7 **Open-source workflow**: pick an issue with no assignee and no linked PR; comment with the cause and plan; fork, branch, fix, test; a clear PR (what was wrong, what changed, how I tested, "Fixes #"); respond to review. Practice repos in my domain: schedule-x (calendar), Rallly (scheduling polls), Atomic CRM (small-business dashboard), cal.diy (booking, very crowded: only fresh issues).
- R8 **Learning from other people's failures**: public postmortems (danluu/post-mortems) and debugging stories; one a week, linked to my apps.
- R9 **Explaining a fix**: the bug-story format for interviews and PRs: symptom → reproduction → hypothesis → evidence → root cause → fix → test → prevention. Keep each story under two minutes; record it and cut the filler.
- Sources: Julia Evans on debugging (jvns.ca: "Some ways to get better at debugging", "A debugging manifesto"), David Agans' *Debugging* (nine rules), git-scm.com/docs/git-bisect, github.com/danluu/post-mortems, docs.stripe.com/webhooks.
- Build (`lesson-r-debugging/`): bug-hunt files with their `-TASK.md`, one folder of notes per real-repo issue I investigate.

## Track A: JavaScript and TypeScript core
IDs A1–A38 keep the old topic numbers, so earlier progress still applies. Teach each one with an example from the apps (booking status unions, Zod-validated payloads, money in cents).
- A1 Values, equality, truthy/falsy · A2 Scope and hoisting · A3 Closures · A4 `this`, arrows, call/apply/bind · A5 Prototypes and how classes work · A6 Promises, async/await, errors · A7 Event loop · A8 Arrays, objects, copies, immutability
- A9 What TypeScript is (types are erased) · A10 tsc, tsconfig, strict · A11 Primitives, tuples, any/unknown/never/void · A12 Inference and widening · A13 Literal, union, intersection types · A14 Type aliases vs interfaces · A15 Object types · A16 Functions and overloads · A17 Narrowing · A18 Discriminated unions and exhaustiveness (booking/payment states) · A19 Type predicates and assertion functions · A20 `as`, `!`, `as const`, `satisfies` · A21 Enums vs literal unions · A22 Classes · A23 extends vs implements, inheritance vs composition
- A24 Generics · A25 Constraints, keyof · A26 Structural typing · A27 typeof and indexed access types · A28–A29 Utility types · A30 Mapped types · A31 Conditional types and `infer` · A32 Template literal types · A33 Recursive types · A34 Typing async code and errors (Result-style returns) · A35 Runtime validation with Zod, sharing types between client and server · A36 Modules and declaration files · A37 Decorators · A38 tsconfig in depth and common traps

## Track B: Time (both apps)
Why: one app books appointments across zones; the other shows "3 hours ago", month labels and daily charts. Time bugs are silent and interviewers love them.
- B1 **Three kinds of time**: an instant (exact moment), a wall-clock time in a zone (9:00 in New York), and a plain date or month with no instant. Which one each field in my apps is, and why.
- B2 **IANA zones and offsets**: zone names vs fixed offsets; why one studio zone is stored separately from instants.
- B3 **Daylight saving**: the missing hour and the repeated hour; what a library does with a wall time that doesn't exist; hiding vs shifting slots. Write the two DST tests.
- B4 **Elapsed time vs calendar time**: "24 hours" vs "tomorrow at the same time"; lead times, reminders and account-age rules.
- B5 **"Today" depends on who's asking**: the business's day vs the browser's day vs the server's day vs the cron's zone; month boundaries and why UTC+14 matters.
- B6 **date-fns + `@date-fns/tz`** (what my booking app uses): TZDate, building slots in the studio zone, formatting back.
- B7 **Temporal**: Instant, ZonedDateTime, PlainDate, PlainYearMonth, Duration, and the disambiguation options for DST. Compare each with how my apps do it today. Check current browser and Node support before stating it.
- B8 **Storing and showing time**: Postgres `timestamp` vs `timestamptz`, the session time zone, `interval '1 day'` vs 24 hours; `Intl.DateTimeFormat` and relative time; server vs browser rendering (hydration mismatches); cached pages that freeze "minutes ago".
- Exercises ready in `lesson-b-time/`: `predict.ts` (Part 0 of the slots task), `slots` (build: slots across zones, buffers, notice, validation, DST days) and `booking-window` (bug hunt: two support tickets). Next: rebuild `slots` with Temporal and compare (B7).
- Speak: "Where does an appointment time live and what does the column mean?" · "What breaks on a DST change?" · "Why is a month stored as a date, not a timestamp?"

## Track C: Data correctness in Postgres
Why: double bookings, drifting counters and duplicate rows are the classic bugs in both apps.
- C1 **Schema and constraints**: primary, foreign, unique, partial unique, check constraints. Let the database enforce rules the app can forget.
- C2 **Transactions and isolation**: ACID, read committed (the Postgres default), and why "check, then insert" can race (time-of-check vs time-of-use).
- C3 **Locks**: row locks (`SELECT … FOR UPDATE`), transaction-scoped advisory locks, lock ordering and deadlocks.
- C4 **Preventing overlaps in the database**: exclusion constraints with `tstzrange` + `btree_gist`, and Postgres 18 `WITHOUT OVERLAPS`. Compare with app-level checks and Redis holds.
- C5 **Counters and snapshots**: counters updated in the same transaction; price/deposit snapshots on the booking so later edits don't change history.
- C6 **Money**: integer cents, tax rounding, separating pre-tax amounts from tax.
- C7 **IDs and pagination**: UUIDv7 (time-ordered, built into Postgres 18), keyset/cursor pagination vs OFFSET, the right composite index.
- C8 **ORMs, migrations and least privilege**: Prisma and Drizzle, migrations, generated columns, and database roles (for example an append-only audit table).
- Build (`lesson-c-data/`): a booking insert that two parallel requests race. Show it double-books, then fix it two ways (exclusion constraint, advisory lock) and explain the trade-off.
- Speak: "How do you stop a double booking, and where can it still fail?" · "How do you keep a vote counter correct under double clicks?"

## Track D: Idempotency and duplicates
Why: double clicks, retries, two tabs and webhook redeliveries hit both apps.
- D1 **What idempotency means**: at-least-once vs at-most-once vs "effectively once".
- D2 **Client-generated keys**: an idempotency table inserted first in the same transaction; what happens on refresh; cleanup of old keys.
- D3 **Natural keys**: one vote per member per post, one open report per target, upsert / insert-on-conflict.
- D4 **Provider keys**: Stripe idempotency keys, email provider keys and their retention windows (check each provider's docs).
- D5 **Side effects after commit**: why a stored event ID can skip an email forever, and how to fix it (see F2).
- Build (`lesson-d-idempotency/`): a "create post" handler that survives double submit, retry and refresh.

## Track E: Payments (booking app)
- E1 **Stripe Checkout**: sessions, expiry, deposit vs balance, reusing a live session.
- E2 **Webhooks**: signature check on the raw body, return 2xx fast and process asynchronously, duplicate events, no ordering guarantee, Stripe's retry window, replay tolerance. Teach from docs.stripe.com/webhooks.
- E3 **Payment state machine**: pending → confirmed → paid/completed/cancelled; never move a cancelled booking back by accident; late webhooks.
- E4 **Verify the amount**: compare what was paid with what was expected before confirming.
- E5 **Refunds, failures and disputes**: handle them or document the policy clearly.
- E6 **Two providers, one rulebook**: keeping PayPal and Stripe consistent (tax, partial vs full).
- E7 **Reconciliation**: catching missed events; testing with the Stripe CLI.
- Build (`lesson-e-payments/`): a webhook handler that processes duplicate, out-of-order and concurrent events safely and records one payment-state change.

## Track F: Background work and reliability
- F1 **Jobs and steps**: durable functions (Inngest), steps, sleeps, default retries, idempotent steps.
- F2 **Transactional outbox**: write "work to do" in the same transaction as the change, so emails and calendar syncs can't be lost.
- F3 **After-response work**: `waitUntil` on edge runtimes and its time limit, vs a real job queue.
- F4 **Retries and backoff**: what to retry, what not to; non-retriable errors; swallowed errors that hide failures.
- F5 **Schedules**: crons and time zones; jobs that must follow a reschedule.
- F6 **Error tracking and alerts**: grouping by fingerprint, alert throttling, cleanup jobs.
- F7 **Cleanup and orphaned files**: deleting files outside a transaction safely.
- F8 *(pull in only when needed)* **The Node event loop under load**: what blocking code does to every request, moving CPU work off the main thread (worker threads, jobs), `EventEmitter` (`.on`, `.once`, errors, listener leaks) and when events beat direct calls.

## Track G: Caching and performance
- G1 **HTTP and edge caching**: Cache-Control, what can be shared vs what is personal, splitting public pages from private data.
- G2 **Invalidation**: purge vs short TTL vs "read your own writes".
- G3 **Redis**: slot holds as courtesy locks, rate-limit counters, TTLs.
- G4 **Database connections at the edge**: pooling (for example Hyperdrive), one connection per request.
- G5 **Images and Core Web Vitals**: resizing on the way out, LCP/INP/CLS.
- G6 *(pull in only when needed)* **APIs at scale**: REST design and error shapes, versioning and backward compatibility, rate limiting and throttling (who gets limited and what they see), payload size and serialisation, monitoring slow endpoints.

## Track H: Auth, security and privacy
- H1 **Sessions and OAuth**: cookies, session lifetime and refresh, Google sign-in (Better Auth).
- H2 **Authorization**: roles, allow-lists, ownership checks; middleware is not enough on its own.
- H3 **Two-factor for staff**: why "installed" is not "enforced".
- H4 **Signed links**: HMAC tokens, expiry, single use.
- H5 **Leaky endpoints (IDOR)**: public routes keyed by an ID that return personal data.
- H6 **Abuse controls**: rate limits that race, bots (Turnstile, honeypots), breached-password checks, disposable emails.
- H7 **Uploads**: signed upload URLs, type/size checks, stripping location metadata.
- H8 **Audit logs and the OWASP Top 10**.

## Track I: Frontend and React
- I1 React 19 and Next.js App Router: server vs client components, server actions.
- I2 Hydration: why server and browser output must match; time and locale traps.
- I3 Server state with TanStack Query: caching, stale data, refetch after a write.
- I4 Forms and validation (client + server, Zod).
- I5 UI states and assumptions: truncation, empty/loading/error states; write the assumptions checklist first.
- I6 Stacking contexts and DevTools: why an overlay sits behind another layer.
- I7 State architecture and re-renders: local vs lifted vs global vs state machine; `memo`, `useMemo`, `useCallback`, and when not to.
- I8 Code review judgment: required change vs comment; overused `useEffect`; when to extract a hook.
- I9 *(pull in only when needed)* CSS layout and responsive design: Flexbox and Grid, mobile first, container and media queries, cross-browser checks, progressive enhancement vs graceful degradation.
- I10 *(pull in only when needed)* Styling at scale: CSS Modules, Tailwind and CSS-in-JS (runtime cost, server rendering), design tokens and a small shared component library.
- I11 *(pull in only when needed)* State libraries: Context vs Zustand vs Redux Toolkit; when each is worth it; selectors; how to answer "have you used Redux?" honestly.
- I12 *(pull in only when needed)* DOM events: bubbling and capture, delegation, `stopPropagation`/`preventDefault`, removing listeners (and `AbortController`), debounce and throttle, finding listener memory leaks in DevTools.
- Build (`lesson-i-frontend/`): one exercise per module, booking-themed, as in the earlier P13–P17 briefs.

## Track J: Feeds, ranking and search (community app)
- J1 **"Hot" ranking without a cron**: adding weights in log space with a fixed epoch so stored scores sort like decayed totals; what removing a vote should do.
- J2 **Cursor feeds and sort tabs**.
- J3 **Full-text search**: generated `tsvector` columns, weights, GIN indexes.
- J4 **Anonymous display vs real ownership**: hiding the author while keeping moderation, rate limits and "no self-votes".

## Track K: Testing
- K1 What to test where: unit, integration, end-to-end (Playwright). This repo uses Node's built-in runner (`node:test`).
- K2 Testing time: fake clocks, DST and month-boundary cases.
- K3 Testing concurrency: firing parallel requests at the same slot or key.
- K4 Testing payments and webhooks: Stripe CLI, replaying events.
- K5 Adding tests to an app that has none: where to start for the most safety.
- K6 Property-based testing with fast-check: generate many inputs to find edge cases (time, money), and its race-condition mode for async code. Add the library when this module starts.
- Note for Track C: race conditions need a real Postgres (Docker or Postgres.app). An in-process Postgres such as PGlite runs one connection at a time, so races never appear. Set it up when Track C starts.

## Track L: Web and platform fundamentals (pull in when needed)
DNS and hosting · HTTP methods, status codes, headers · HTTPS/TLS · how browsers render · CORS · REST API design and error shapes · request lifecycle and middleware · edge runtimes (Workers) vs Node servers · Docker, CI/CD, config and secrets · observability (logs, metrics, traces).

## Track M: System design and speaking
- M1 The method: requirements, estimates, components, data, failure modes, trade-offs.
- M2 Design: a booking system for many businesses (double-booking prevention, holds, payments, reminders).
- M3 Design: a community feed (ranking, caching, moderation, notifications).
- M4 Explaining my two real apps end to end in 2 minutes and in 10 minutes.
- M5 Talking about weak spots honestly: "here's the gap, here's why it exists, here's how I'd fix it".
- M6 STAR stories from real work only, plus full mock interviews.
- M7 *(practice format)* **Interview bank** (`interview-bank/`): real topics from platform interviews and tests, each mapped to a module here. One question per session in the Speak step; a 6-question mock every two weeks.
- M8 *(practice format)* **Timed coding tests**: 25–45 minute problems in my own editor, no AI, talking out loud: small JS utilities, array/string/object problems, a React component with state, and "fix this broken function". Score: working code, edge cases, clear narration, time used.

## Track N: AI engineering
How LLMs work · prompting · structured outputs and tool calling · embeddings and RAG · agents and MCP · AI with a fallback (one of my apps calls a model, then a keyword fallback) · evaluating AI-generated code (correctness, edge cases, security) · writing rubrics, test cases and coding tasks for AI training.

---

## Facts checked on 2026-11-21 (re-check before teaching)
- Temporal is part of the language standard (Stage 4, 2026). It's on by default in Node.js 26 and shipped in Chrome 144 and Firefox 139. Safari had not shipped it in stable. Sources: nodejs.org/en/blog/release/v26.0.0, MDN, caniuse.com/temporal.
- Postgres 18 added `uuidv7()` and `WITHOUT OVERLAPS` for primary key and unique constraints. Before 18, use an exclusion constraint with `btree_gist`. Source: postgresql.org release notes.
- Stripe: events can arrive more than once and in any order; track event IDs; return 2xx before complex logic; live-mode retries run for up to three days; verify the signature on the raw body. Source: docs.stripe.com/webhooks.
- Resend keeps idempotency keys for 24 hours. Source: resend.com/docs.
- Inngest retries a step 4 times after the first attempt by default. Source: inngest.com/docs.
- Cloudflare `waitUntil` can extend work for up to 30 seconds after the response. Source: developers.cloudflare.com/workers.

## Platform interview facts checked on 2026-11-22 (re-check before relying on them)
- micro1: public practice pages per role (10 questions each) plus a free 18-minute AI practice interview; the real interview is 20–40 minutes, about 7 minutes per skill, and some roles add a coding exercise. Sources: micro1.ai/interview-prep, library.micro1.ai.
- Turing: vetting = profile, work-experience survey, tech-stack multiple-choice tests (45–120 minutes; React JS, React Hooks, Node JS and others) and a live coding challenge; a failed stack test can be retaken after three months. Source: turing.com/blog/turing-developer-test-preparation-tips.
- Mercor: a free practice interview you can take as many times as you like; official interviews can be retaken up to three times; some interviews are a deep discussion of past work. Source: talent.docs.mercor.com/support/ai-interview.

## Why this design (sources)
- Struggle first: a meta-analysis of 53 studies (166 comparisons) found problem-solving before instruction beats instruction first for conceptual understanding and transfer, when learners have some prior knowledge. Sinha & Kapur (2021), Review of Educational Research, doi:10.3102/00346543211019105.
- Less guidance as experience grows: methods that help beginners (worked examples, step-by-step guidance) can hurt more experienced learners (the expertise reversal effect). Kalyuga, Ayres, Chandler & Sweller (2003), Educational Psychologist 38(1); Kalyuga (2007), Educational Psychology Review.
- AI that writes code for you lowers mastery, most of all for debugging; using AI to ask conceptual questions while coding yourself keeps learning high. Anthropic, "How AI assistance impacts the formation of coding skills" (2026): anthropic.com/research/AI-assistance-coding-skills
- An unrestricted AI tutor works like a crutch; a tutor with guardrails avoids the drop. Bastani et al., PNAS 2025, "Generative AI without guardrails can harm learning".
- A tutor that gives one step at a time, asks the learner to try first and keeps replies short doubled learning gains. Kestin et al., Scientific Reports 2025, "AI tutoring outperforms in-class active learning". Structure had to come from the platform, not the prompt alone.
- Trying problems before instruction (productive failure) beats instruction first when the learner has prior knowledge. Sinha & Kapur, Review of Educational Research 2021.
- Predict → Run → Investigate → Modify → Make (PRIMM). Sentance, Waite & Kallia 2019.
- Too much worked-example guidance hurts experienced learners (expertise reversal), so support fades fast.
- Retrieval, spacing, interleaving and self-explanation: Dunlosky et al. 2013 and Weinstein et al. 2018.
