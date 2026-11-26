# micro1 — Software Engineer, New Grad (×2)

**What this is:** two applications for micro1's own engineering team (a "core team" job, not contract tasks). **Applied:** 23 Nov 2026. **Status:** Interview pending (micro1 dashboard, checked 26 Nov 2026). **Deadline:** none shown on the dashboard. Don't leave it too long.

**Both postings have the same text** (checked on jobs.micro1.ai, posts `364acc50…` and `6955441d…`, 26 Nov 2026). A third posting, "Software Engineer, New Grad (Zara)" (`0b9d8e73…`), has the same requirements but works on Zara, the AI recruiter. I can't tell from the dashboard which two postings I applied to, so prepare for both versions.

## From the posting

**Job type:** full-time, remote. The Zara version adds "must overlap PST timezone at least 6–8 hours" (PST 9:00–17:00 is 18:00–02:00 WAT).

**Pay:** the header shows $180K–250K/yr. The pay notice in the same posting says the base salary is **$110,000–150,000 USD**, plus equity and possible bonuses.

**Required skills tags:** React, Node.js, AWS, PostgreSQL, AI native (Zara version: DevOps instead of AI native).

**The work:**
- Full-stack systems for internal tools, services, workflows and AI products (engineering, operations and recruiting platforms).
- Backend services and APIs.
- Frontend interfaces for internal teams and users.
- Data modeling, schema design, query performance.
- Code reviews, testing, documentation.
- Troubleshooting production issues; resilient, observable systems.
- Trade-offs between speed, scalability and maintainability.

**What they want:**
- Bachelor's degree in Computer Science, Computer Engineering, Software Engineering **or a related field** (recent graduate or graduating soon).
- Internship, research or meaningful personal/project experience building software.
- Strong JavaScript and/or TypeScript fundamentals.
- React (or similar).
- Node.js backend (**NestJS is a plus**).
- PostgreSQL and data modeling.
- REST APIs and how distributed apps talk to each other.
- Git and modern workflows.

**Preferred:** internship or professional experience; AWS/GCP/Azure; CI/CD; microservices, serverless or event-driven systems; AI products or workflow automation; team projects, hackathons, open source or startups.

## Honest risks (say the truth, don't dodge)

1. **Degree:** mine is B.Sc. Geography and Planning (2017), not CS and not "recent". Don't stretch it. Say it once, plainly: "My degree is in Geography and Planning. I've been building software since 2021, did a software internship in 2025, and now build production systems for clients."
2. **"New grad":** I'm not a new grad. The posting also says "early-career engineers", which fits better. Lead with that.
3. **AWS:** I haven't used AWS. My hosting is Vercel and Cloudflare, my database is Neon PostgreSQL. Say exactly that. Don't name AWS services I haven't used.
4. **Past micro1 results:** I didn't qualify for Software Engineer, Backend, Sr Full-Stack, Frontend/UI and Senior Frontend (JS) (12–26 Nov). The Backend feedback (19 Nov): explain flows end to end with schema, scheduling and email detail; `interface` vs `type`; `implements` vs `extends`; arrays and hashing. All four are covered by the modules below.

## Interview format

- What I saw on micro1 (24 Nov 2026): an AI interview with Zara of up to ~48 minutes, then a coding exercise of ~25 minutes. Check the interview page when you open it; it may differ.
- Candidates' reports (not official): Zara asks follow-ups on whatever keywords you mention, and the coding part is often a LeetCode-style problem (merge intervals and debugging React/JavaScript are mentioned). Don't mention a tool you can't go one level deeper on.
- Before you start: laptop on power, stable internet, mic and camera allowed, Chrome screen sharing allowed (macOS: Privacy & Security → Screen & System Audio Recording). One tab, one screen.

## What to study, in order

| Priority | What | Where |
|---|---|---|
| 1 | Explain a flow end to end (the Backend feedback) | [JS 13: explaining flows](../modules/01-javascript/13-explain-flows.md), [Node 06: API design](../modules/04-node-rest/06-api-design.md) |
| 2 | Arrays and hashing (Map/Set), Big-O | [JS 07: arrays](../modules/01-javascript/07-arrays.md), [JS 08: Map/Set](../modules/01-javascript/08-map-set-weak.md), drill table in [the Open Source role page](micro1-open-source-contributions.md#3-algorithms-and-data-structures-drill-list) |
| 3 | `type` vs `interface`, `implements` vs `extends` | [TS 03](../modules/02-typescript/03-type-vs-interface.md), [TS 09](../modules/02-typescript/09-classes.md) |
| 4 | React fundamentals and debugging | [React 01](../modules/03-react/01-rendering-model.md), [02](../modules/03-react/02-state-updates.md), [03 effects](../modules/03-react/03-effects.md) |
| 5 | Node + REST: status codes, errors, idempotency, security | [Node 05](../modules/04-node-rest/05-http-semantics.md), [06](../modules/04-node-rest/06-api-design.md), [07](../modules/04-node-rest/07-security.md), [02](../modules/04-node-rest/02-errors-process.md) |
| 6 | Event loop and async | [JS 05](../modules/01-javascript/05-event-loop-promises-async.md), [Node 01](../modules/04-node-rest/01-event-loop.md) |
| 7 | PostgreSQL and data modeling | Module 06 isn't built yet. Use the questions in section "Likely questions" below. |

## Your 2-minute intro (outline, in your own words)

1. Full-stack developer, TypeScript, React/Next.js and Node.js; Python with FastAPI.
2. Since 2026 I build booking and payment systems for small service businesses: one has been in production for a studio since May 2026 (direct and consultation bookings, intake forms before payment, Stripe deposits and balances, an owner dashboard, scheduled reminders). I also built a community review platform in 5 weeks.
3. I maintain an open-source TypeScript booking engine: strict TypeScript, tests with Vitest, CI, decision records, money in integer minor units.
4. Internship in 2025 (Python, FastAPI, Flask, debugging, manual user tests).
5. Why micro1: internal platforms and AI-powered products are the kind of end-to-end work I already do; I want a team and code review to grow faster.

This page is public, so it stays generic ("a studio", "a community platform"). In the interview you can say what your CV says. Don't give live numbers (bookings, users).

## Likely questions and how to answer

**"Walk me through a feature end to end."** Use the booking flow: page → form validation → API route → validate again on the server → database write in a transaction → Stripe payment → webhook confirms (check the signature, handle duplicates with an idempotency key) → email confirmation → scheduled reminder job. Name the tables (services, bookings, payments) and what makes a slot unavailable.

**"How would you design the schema for X?"** Start with the nouns → tables, one-to-many vs many-to-many, primary and foreign keys, a unique constraint for the rule the business can't break (e.g. no two bookings for the same slot), indexes on what you filter by, money as integer minor units with a currency column, times stored as UTC instants.

**"A query is slow. What do you do?"** Measure first (`EXPLAIN ANALYZE`), look for sequential scans on big tables, add the right index, avoid N+1 queries from the app, paginate. Say you'd confirm with the plan, not guess.

**"400 vs 500 errors?"** 4xx: the client sent something wrong (400 bad input, 401 not signed in, 403 not allowed, 404 not found, 409 conflict, 422 validation, 429 too many requests). 5xx: the server failed. See [Node 05](../modules/04-node-rest/05-http-semantics.md).

**"How do you debug a slow web page?"** Reproduce, then DevTools Performance and Network tabs: big bundles, slow API calls, re-renders. Fix the measured cause; measure again.

**"Something broke in production. What do you do?"** Check the logs and error alerts, reproduce, roll back or hotfix if users are blocked, write a failing test, fix, keep the test.

**"Speed vs quality trade-off you made."** A real one from your work: e.g. shipping the review platform in 5 weeks, what you kept (spam protection, moderation) and what you left for later. **[YOU FILL]** with the real detail.

**"How do you use AI tools?"** The posting tags "AI native". Say how you really use them: research, first drafts, explaining unfamiliar code, then you read, test and correct the output. Give one example where you caught a wrong answer. **[YOU FILL]**

**Coding part:** say the plan out loud first (brute force → better, with Big-O), handle empty input and duplicates, run small examples. If you're stuck, say what you're trying.

## Checklist before you click Start

- [ ] Read this page and the [Open Source role page](micro1-open-source-contributions.md) sections 2–4
- [ ] Practised the 2-minute intro out loud twice
- [ ] One real bug story ready (cause → how you found it → fix → test)
- [ ] Two hash-map drills done on paper (two-sum, group anagrams) and merge intervals
- [ ] Power, internet, camera, mic, screen sharing checked
