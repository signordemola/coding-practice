# 06. API design: error format, idempotency keys, pagination, a booking flow

**Sources:**
- [RFC 9457 Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457) (July 2023), read from the `ietf-wg-httpapi/rfc7807bis` source (last commit 28 Jul 2023)
- [The Idempotency-Key HTTP Header Field](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/), IETF **Internet-Draft, work in progress**, from the `ietf-wg-httpapi/idempotency` repo (commit of 21 Nov 2026), read in full
- [OWASP API4:2023 Unrestricted Resource Consumption](https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/) (for page-size limits)

**Run the checks:** `node interview-prep/modules/04-node-rest/examples/run-all.js` (this topic: `examples/06-api-design.ts`)

## Explain

### One error format: `application/problem+json` (RFC 9457)
```json
{
  "type": "https://example.com/problems/validation",
  "status": 422,
  "title": "Validation failed",
  "detail": "slotId does not exist",
  "instance": "/bookings",
  "errors": [{ "pointer": "#/slotId", "detail": "unknown slot" }]
}
```
- `type`: a URI identifying the problem type (defaults to `about:blank`); clients branch on it, not on `title`.
- `status`: must match the actual HTTP status (checked in every example response).
- `title`: short and the same for every occurrence of that type; `detail`: this occurrence.
- `instance`: identifies this occurrence.
- **Extensions** are allowed. The RFC's own example lists validation errors with JSON Pointers to the bad fields, as above (checked).
- Don't leak stack traces or internals in `detail`.

### Idempotency keys for POST (draft spec)
Problem: a client POSTs a booking, the connection drops, and it doesn't know whether it worked. Retrying could double-book (or double-charge).
- The client sends **`Idempotency-Key: <unique value>`**; the draft recommends a UUID or similar random value.
- The server stores the key with the result. A **retry with the same key replays the first result** instead of doing the work again (checked: the same `Location` comes back, and only one booking is created).
- From the draft:
  - key missing on an endpoint that requires it → **400**;
  - same key, **different payload** → **422** (servers may store a payload fingerprint; the example uses SHA-256, checked);
  - same key while the first request is **still running** → **409** (checked with a slow create);
  - keys can expire; publish the expiry policy.
- **Scope keys per client.** The draft suggests the server may combine the key with client details; the example stores `userId:key`, so two users using the same key don't collide (checked). That exact scoping is my choice following that advice.
- It's still a draft. Stripe and others use the same header, but the details aren't standardised yet.
- The idempotency key protects against *retries*. **Two different bookings** for the same slot are a separate problem: the slot check gives **409** (checked). In a real database that last line of defence is a unique constraint (module 06).

### Pagination
- **Cursor-based** (`?cursor=…&limit=…` → `{ items, nextCursor }`): stable while data changes, and doesn't need `OFFSET` scans. Offset pagination is simpler but can skip or repeat rows when data shifts. *(The trade-off is common practice, not from a document I read for this module; the SQL side is module 06.)*
- **Cap the page size** (OWASP API4): the example returns **400** for `limit=5000` and allows 1–100 (checked: 3 pages of 100/100/50 = 250 unique slots).

### A booking flow end to end (the example API)
1. `POST /sessions` → 201, token plus an HttpOnly session cookie (topic 07).
2. `GET /slots?limit=100` → paginate free slots.
3. `POST /bookings` with `Authorization: Bearer …`, `Idempotency-Key`, `{ "slotId": … }` → **201** + `Location: /bookings/b1` + `ETag`, with the deposit in **integer minor units** (`depositMinor: 2500`) set by the server, never by the client.
4. `GET /bookings/b1` → 200 with `ETag` (304 with `If-None-Match`).
5. `PATCH /bookings/b1` with `If-Match`, `{ "status": "cancelled" }` → 200, or 412 if stale.
6. `DELETE /bookings/b1` → 204.

Payments (Stripe deposits) aren't part of this example; the order would be: create the booking as pending, take payment with its own idempotency key, confirm on the webhook.

## Traps
- Every error a different shape (`{ msg }`, `{ error }`, plain text).
- `status` in the body different from the HTTP status.
- Idempotency keys that are global instead of per client.
- Replaying a stored result for a *different* payload.
- Unbounded `limit`.
- Prices or deposits taken from the request body.

## Practice questions

**Q1. How do you make POST safe to retry?** Require an Idempotency-Key; store key, payload fingerprint and response; replay the response on retry, reject a different payload (422) and concurrent duplicates (409).

**Q2. What format do you use for API errors?** RFC 9457 problem details: `type`, `status`, `title`, `detail`, `instance`, plus extensions like a list of field errors with JSON pointers.

**Q3. Cursor vs offset pagination?** Offset is simple but drifts when rows are inserted or deleted, and gets slower deep in the list; a cursor continues from the last item seen. Either way, cap the page size.

**Q4. Two people try to book the same slot at once. What happens?** The first gets 201, the second 409. In the app I check availability, and in the database a unique constraint makes it impossible to double-book even under a race.

## Say it (about 40 seconds)
"Every error comes back as RFC 9457 problem details, with a type URI, the matching status, a title, a detail and, for validation, a list of field pointers, so clients can handle errors one way. For booking creation I require an Idempotency-Key: the first request stores the key, a payload fingerprint and the result; a retry gets the same result, a different payload with the same key gets 422, and a retry while the first is still running gets 409. Keys are scoped per client. Lists use cursor pagination with a capped page size, and amounts like the deposit are integers in minor units set by the server."
