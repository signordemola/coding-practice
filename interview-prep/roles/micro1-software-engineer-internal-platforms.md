# micro1 — Software Engineer, Internal Platforms

**What this is:** a full-time job on micro1's own engineering team. **Applied:** 23 Nov 2026. **Status:** Interview pending (micro1 dashboard, checked 26 Nov 2026). **Deadline:** none shown. **Dashboard skill tags:** React, Node.js, PostgreSQL, +1.

**Source warning:** I couldn't reopen the exact posting (the dashboard card has no link, and the post ID I found now shows a different role). The details below come from copies of the posting on job boards (Dice, freehire) and from my own note when I applied (base pay $120K–155K). Check the interview page when you open it.

## From the posting (job-board copies, not verified on micro1)

- High-ownership full-stack role: "contribute to — and grow into owning — core internal platform systems end-to-end".
- Build and improve the internal tools, services and workflows behind micro1's operations, products and AI infrastructure.
- Backend services and APIs with clear contracts; frontend interfaces used by internal teams.
- Improve platform reliability, observability and developer experience.
- Exposure to AWS (or similar).
- Nice to have: internal developer platforms, operational tooling or workflow automation; AI-adjacent or data-heavy products.
- One copy says: "Remote (Must overlap PST timezone at least 6–8 hours)". PST 9:00–17:00 is 18:00–02:00 WAT.

**Years of experience:** not shown in the copies I found. A similar micro1 posting ("Platform Engineering") asks for 4+ years, so this may be a stretch at 2 years. Don't claim more than 2.

## Interview format

Probably the same as the New Grad interviews: an AI interview with Zara, then a coding exercise. Check the interview page for the time limit and focus areas before you start.

## How it differs from the New Grad role

The New Grad page covers the shared basics. This one leans more on **internal tools and running systems**, so add:

1. **Internal tools you've built:** the admin/owner dashboards in your booking systems, and your own client portal (clients, leads, versioned scopes, payment milestones, referrals). That's real internal tooling: say it.
2. **Workflow automation:** scheduled jobs (reminders, payment links), email notifications, error alerts sent to a chat channel, automated database backups in GitHub Actions.
3. **Observability:** what you log, how you find a production error (error alerts → logs → reproduce → fix → test), what you'd add next (structured logs, request IDs, metrics, alerts on error rate). See [Node 02: errors and process](../modules/04-node-rest/02-errors-process.md).
4. **Developer experience:** strict TypeScript, CI on every push, tests first, decision records (your booking-engine). Say why each one saves time.
5. **Reliability:** idempotency for webhooks and retries, timeouts on external calls, graceful shutdown. See [Node 06: API design](../modules/04-node-rest/06-api-design.md) and [Node 02](../modules/04-node-rest/02-errors-process.md).

## Likely questions (on top of the New Grad list)

**"Design an internal tool for X (e.g. tracking interview reviews)."** Users and roles → data model (tables, keys, statuses) → API endpoints → permissions (who can see what; check on the server, not just the UI) → audit log for changes → the screen. Say what you'd ship first and what later.

**"How do you keep an internal system reliable?"** Validate input at the boundary, safe retries (idempotency keys), timeouts, alerts on errors, a way to roll back, tests on the failure paths, not only the happy path.

**"Tell me about a background job you built."** Your scheduled reminders: what triggers them, what happens if one fails or runs twice, how you'd know.

**"Monolith or microservices?"** For a small team: one well-structured app first; split only when a part needs to scale or deploy on its own. Name the cost of splitting (network calls, data consistency, more to run).

**"AWS?"** Truth: no hands-on AWS yet; you host on Vercel and Cloudflare with managed PostgreSQL (Neon). Say what you'd expect the equivalents to be only if asked, and keep it short.

## Study order

Same as the [New Grad page](micro1-software-engineer-new-grad.md#what-to-study-in-order), then the five topics above. Use the [Open Source role page](micro1-open-source-contributions.md) sections 3–4 for algorithms and testing.

## Checklist before you click Start

- [ ] New Grad page checklist done
- [ ] One internal-tool story ready (what it does, who uses it, data model, one problem you fixed)
- [ ] One background-job story ready (trigger, failure, duplicate run, how you'd notice)
- [ ] Power, internet, camera, mic, screen sharing checked
