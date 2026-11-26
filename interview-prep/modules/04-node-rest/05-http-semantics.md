# 05. HTTP semantics for REST APIs: methods, status codes, conditional requests

**Sources:**
- [RFC 9110 HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (June 2022), read from the `httpwg/http-core` XML source: sections 9 (methods), 13 (conditional requests), 15 (status codes), 8.8 (validators: ETag)
- [RFC 6585](https://www.rfc-editor.org/rfc/rfc6585) via [MDN: 429 Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429) and [Retry-After](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Retry-After) (MDN commit `6f16e81`, 25 Nov 2026)

**Run the checks:** `node interview-prep/modules/04-node-rest/examples/run-all.js` (this topic: `examples/05-http-semantics.ts`, against `examples/lib-booking-api.ts`)

## Explain

### Methods: safe and idempotent
| Method | Safe | Idempotent | Typical use |
|---|---|---|---|
| GET, HEAD, OPTIONS, TRACE | yes | yes | read |
| PUT | no | **yes** | replace the resource at this URI (create it if absent) |
| DELETE | no | **yes** | remove |
| POST | no | no | create under a collection, or "process this" |
| PATCH | no | not guaranteed | partial change (defined in RFC 5789, not read here) |

- **Safe** = the client doesn't request a change (read-only semantics). The server may still log.
- **Idempotent** = sending it N times has the same *intended effect* as once. The responses can differ (a second DELETE may get 404, checked).
- Why it matters: RFC 9110 says a client **shouldn't automatically retry a non-idempotent request** unless it knows it's safe to. That's why POST needs an idempotency key (topic 06).

### Status codes that come up
| Code | When (RFC 9110 unless noted) |
|---|---|
| **200** OK | general success |
| **201** Created | POST/PUT created something; send **`Location`** with its URI (checked) |
| **202** Accepted | accepted for later processing |
| **204** No Content | success, no body (DELETE, checked) |
| **304** Not Modified | conditional GET; the client's copy is current (checked) |
| **400** Bad Request | malformed request (bad JSON, missing required header) |
| **401** Unauthorized | **not authenticated**; must send **`WWW-Authenticate`** (checked) |
| **403** Forbidden | authenticated (or not) but refused |
| **404** Not Found | not found, **or the server won't reveal that it exists** (topic 07) |
| **405** Method Not Allowed | must send **`Allow`** (checked) |
| **409** Conflict | conflicts with the resource's current state (slot already booked, checked) |
| **412** Precondition Failed | `If-Match` failed (checked) |
| **413** Content Too Large | body over the limit (checked) |
| **415** Unsupported Media Type | wrong `Content-Type` (checked) |
| **422** Unprocessable Content | well-formed but semantically invalid (validation, checked) |
| **428** Precondition Required | RFC 6585: "send `If-Match`". *I haven't read RFC 6585 itself; this is my use of it.* |
| **429** Too Many Requests | RFC 6585 (via MDN); may send `Retry-After` (topic 07) |
| **500** / **503** | server fault / temporarily unavailable (503 may send `Retry-After`) |

### Conditional requests: ETags
- An **`ETag`** is an opaque version tag for a representation.
- **Caching:** `GET` with `If-None-Match: <etag>` → **304** with no body if unchanged (checked).
- **Lost updates:** two clients read version 1, both write; the second silently overwrites the first. Fix: send `If-Match: <etag>` on the write; the server answers **412** if the resource changed since (checked: a stale ETag gets 412, a fresh one 200 with a new ETag).
- The example API requires `If-Match` on PATCH and answers 428 without it.

### 401 vs 403 vs 404
- 401: "who are you?" (no or invalid credentials).
- 403: "I know who you are, and no."
- 404: hide the resource altogether, which RFC 9110 explicitly allows. The example uses it for other users' bookings (topic 07).

## Traps
- 200 with `{ "error": … }` in the body.
- 401 for "logged in but not allowed" (that's 403 or 404).
- 201 without `Location`.
- 405 without `Allow`.
- Calling PUT "update" and POST "create" as a strict rule: it's about idempotency and who picks the URI.
- Auto-retrying POST on a timeout.

## Practice questions

**Q1. Which methods are idempotent, and why does it matter?** GET, HEAD, OPTIONS, TRACE, PUT, DELETE. It tells clients and proxies what's safe to retry after a network failure; POST isn't, so retrying it can double-create.

**Q2. 401 vs 403?** 401 means not authenticated and comes with `WWW-Authenticate`; 403 means the server understood who you are and refuses.

**Q3. 400 vs 422?** 400: the request itself is malformed (bad JSON). 422: it parses fine but the content is invalid (a missing field, an unknown slot).

**Q4. How do you stop two users overwriting each other's edits?** Optimistic concurrency: return an ETag, require `If-Match` on updates, answer 412 if it no longer matches, so the client re-reads and retries.

**Q5. What should a successful POST that creates a booking return?** 201 with a `Location` header for the new resource, and usually its representation.

## Say it (about 35 seconds)
"I lean on HTTP semantics rather than inventing my own. GET, PUT and DELETE are idempotent, POST isn't, which is why clients shouldn't blindly retry it. Creation returns 201 with a Location header, deletes 204, and errors use the precise code: 400 for malformed input, 422 for invalid content, 401 with WWW-Authenticate when you're not signed in, 403 or 404 when you're not allowed, 409 for conflicts like a slot already taken, 429 when rate-limited. For concurrent edits I return ETags and require If-Match, answering 412 if the resource changed."
