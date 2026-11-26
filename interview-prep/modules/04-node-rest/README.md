# Module 04: Node.js + REST APIs

**Why this module fourth:** most of the roles I apply for after JavaScript, TypeScript and React want backend work in Node: how the runtime behaves, building HTTP APIs, and getting the HTTP and security details right.

**How it was built (26 Nov 2026):**
- **Node.js API docs for v26.13.1** (the latest Node 26 release), read from the `nodejs/node` repository at tag `v26.13.1` (10 Nov 2026). The `main` branch already describes the next major (27), so it wasn't used; where 27 changes a default, the page says so.
  - Errors (propagation, system errors), Process (`uncaughtException`, `unhandledRejection`, signals, `exit`, `exitCode`), the CLI flag `--unhandled-rejections`, HTTP `Server` (close and timeout entries), `stream.getDefaultHighWaterMark`, `events.once`: those sections in full, not the whole API reference.
- **nodejs.org Learn pages**, read from `nodejs/learn` (commit `ea10f2a`, 1 Nov 2026): event loop, `process.nextTick`, `setImmediate`, Don't Block the Event Loop, the event emitter, Anatomy of an HTTP Transaction, Backpressuring in Streams. Each topic says what was read in full or skimmed.
  - Two Learn pages are partly outdated, and the pages say where: the backpressure guide's "16kb" default (64 KiB since Node 22), and "Don't Block" (its sync-API list is "as of v9" and it predates `worker_threads`).
- **RFC 9110** (HTTP Semantics, June 2022): methods, conditional requests, status codes and validators, read from the `httpwg/http-core` XML source (rfc-editor.org isn't reachable from my workspace).
- **RFC 9457** (Problem Details, July 2023), from `ietf-wg-httpapi/rfc7807bis` (last commit 28 Jul 2023).
- **Idempotency-Key header**, an IETF **draft, still work in progress**, from `ietf-wg-httpapi/idempotency` (commit of 21 Nov 2026), read in full.
- **MDN** (`mdn/content` commit `6f16e81`, 25 Nov 2026), read in full: CORS, Using HTTP cookies, Set-Cookie, 429, Retry-After.
- **OWASP API Security Top 10 2023** (`OWASP/API-Security` commit `33cea37`): API1, API2, API3, API4, API6 in full.
- **Every behaviour is checked by running it.** `examples/` has one `.ts` file per topic. Topics 05–07 start a small booking API (`lib-booking-api.ts`, plain `node:http`, no framework) on a random port and call it with `fetch`, asserting statuses, headers and bodies. The examples type-check with the repo's TypeScript (tsc 7.0.2) and run with Node's type stripping.
- Run on **Node 22.23.4** (my build workspace). Where Node 22 and 26 differ (the `keepAliveTimeout` default is the same on both; v27 changes it), the check reads the running version.
- Anything that's my own reasoning or common practice, not something I read, is marked. In particular: the graceful-shutdown pattern combines two documented facts (topic 02); 428 comes from RFC 6585, which I haven't read itself (topic 05); scoping idempotency keys per user is my application of the draft's advice (topic 06).

## How to use it
1. Read a topic page.
2. Open its example file and predict each `assert` before reading it.
3. Close both; answer the practice questions out loud, then check.
4. Say the "Say it" answer in your own words, timed.
5. Before an interview, do the mock round.

**Run every check** (from the repo root, after `pnpm install`):
```bash
node interview-prep/modules/04-node-rest/examples/run-all.js
```

## Topics

| # | Topic | Main sources | Example file |
|---|---|---|---|
| 01 | [The event loop, and not blocking it](01-event-loop.md) | Learn: event loop, nextTick, setImmediate, Don't Block | `01-event-loop.ts` |
| 02 | [Errors, crashes, exit codes, graceful shutdown](02-errors-process.md) | API: Errors, Process, CLI, `server.close` | `02-errors-process.ts` |
| 03 | [Streams and backpressure](03-streams.md) | Learn: Backpressuring, Event emitter; API: streams, events | `03-streams.ts` |
| 04 | [An HTTP server with `node:http`](04-http-server.md) | Learn: Anatomy of an HTTP Transaction; API: HTTP Server; OWASP API4 | `04-http-server.ts` |
| 05 | [HTTP semantics: methods, status codes, ETags](05-http-semantics.md) | RFC 9110; RFC 6585 via MDN | `05-http-semantics.ts` |
| 06 | [API design: problem details, idempotency keys, pagination, a booking flow](06-api-design.md) | RFC 9457; Idempotency-Key draft; OWASP API4 | `06-api-design.ts` |
| 07 | [API security: auth, BOLA, mass assignment, CORS, cookies, rate limits](07-security.md) | OWASP API Top 10 2023; MDN CORS and cookies | `07-security.ts` |

## Mock round (20 questions, about 15 minutes)
Answer each out loud in under a minute. The topic number is where the answer lives.

1. Node is single-threaded. How does it serve thousands of connections? (01)
2. Name the event loop phases. Where do `setTimeout` and `setImmediate` callbacks run? (01)
3. Predict the order: `nextTick`, `Promise.then`, `setTimeout(0)`, `setImmediate`. What changes inside an I/O callback, and in an ES module? (01)
4. Five ways to block the event loop, and how to avoid each. (01)
5. What is ReDoS? Give a dangerous regex pattern. (01)
6. Four ways Node APIs report errors. What happens to an `'error'` event nobody listens for? (02)
7. What happens to an unhandled promise rejection by default, and since when? (02)
8. Is it OK to log in `uncaughtException` and keep serving? (02)
9. `process.exit()` vs `process.exitCode`. (02)
10. Shut down an HTTP server gracefully on `SIGTERM`. (02, 04)
11. What is backpressure, and what does `write()` returning `false` mean? (03)
12. `pipeline` vs `.pipe()`. (03)
13. Handle a JSON POST in plain `node:http`, with every failure status. (04)
14. What do `requestTimeout` and `headersTimeout` protect against? (04)
15. Which methods are idempotent? Why shouldn't a client auto-retry POST? (05)
16. 400 vs 422; 401 vs 403 vs 404. (05, 07)
17. Stop two users overwriting each other's edits. (05)
18. Make booking creation safe to retry. What do you return for a different payload, and for a concurrent retry? (06)
19. What is BOLA, and how do you prevent it? What is mass assignment? (07)
20. Does CORS protect your API? Which cookie attributes go on a session cookie? (07)

Bonus: what error format do you use (06)? How would you return a large CSV export (03)? What does API6 say about booking systems (07)?

## What moved here from the old guide (`interview-bank/study-guide.md`, Part D, F1–F3)

| Old | New | Changes after checking against the sources |
|---|---|---|
| F1 booking end to end | 06 (flow), 05, 07 | The HTTP steps now run against the example API: 201 + `Location`, idempotency key, 409 for a taken slot, ETag and `If-Match`, server-set deposit in minor units. The Postgres transaction and unique constraint go to module 06. Stripe, webhooks, DNS/HTTPS and email steps are kept in the old guide as my practice; their docs weren't read for this module. |
| F2 REST and HTTP basics | 05 | Every row now cites RFC 9110. Added safe vs idempotent, `Location`, `Allow`, `WWW-Authenticate`, 304/412/413/415, and "404 may hide existence". PATCH stays "not guaranteed". 422 is "Unprocessable Content" (its RFC 9110 name). 429 is RFC 6585. |
| F3 authentication basics | 07 | Cookie attributes now sourced from MDN, plus `SameSite=None` needing `Secure`, `Max-Age` vs `Expires`, the `__Host-` prefix and regenerating the session on login. JWT points limited to OWASP API2's; the "hard to revoke" trade-off is common practice, not checked here. "Does this booking belong to this user?" is now BOLA (API1), checked. |

The old guide's F1–F3 can be shortened to pointers here; F4 (Postgres) goes to module 06 and F5 (deployment) is covered by module 08a.

## Not covered (yet)
- `worker_threads`, `cluster`, child processes in depth.
- `fetch`/undici internals, HTTP agents and connection pooling, HTTP/2.
- HTTP caching (`Cache-Control`; the MDN page wasn't read for this module).
- JWT and OAuth details beyond OWASP API2; password hashing.
- Express, Fastify, Hono and other frameworks; Zod and other validation libraries.
- The Node test runner and mocking in depth (module 05).
- The Node.js Security Best Practices page, and the profiling and diagnostics guides.
- Postgres transactions and constraints (module 06); Stripe payments and webhooks.

These need pages I haven't read; add them if needed.
