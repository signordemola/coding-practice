# 07. API security: authentication, object-level authorization, CORS, cookies, rate limits

**Sources:**
- [OWASP API Security Top 10 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/), from `OWASP/API-Security` commit `33cea37`: API1 BOLA, API2 Broken Authentication, API3 Broken Object Property Level Authorization, API4 Unrestricted Resource Consumption, API6 Unrestricted Access to Sensitive Business Flows (those pages in full)
- MDN (commit `6f16e81`, 25 Nov 2026, read in full): [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) · [Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies) · [Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie) · [429](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429)
- RFC 9110 sections 11 (authentication) and 15.5.2 (401)

**Run the checks:** `node interview-prep/modules/04-node-rest/examples/run-all.js` (this topic: `examples/07-security.ts`)

## Explain

### Authentication (API2)
- Every protected endpoint checks credentials; failures return **401** with `WWW-Authenticate` (checked: missing and forged tokens).
- OWASP API2's points: protect login and password-reset against brute force (rate limits, lockout); don't put tokens in URLs; validate JWTs properly (reject unsigned `alg: none` tokens, check expiry); require re-authentication for sensitive changes. Its warning: **API keys aren't user authentication**, and OAuth isn't authentication either.
- JWT internals and OAuth flows aren't covered beyond those points.

### Object-level authorization: BOLA (API1, the top risk)
- The bug: `GET /bookings/42` returns booking 42 to **anyone signed in**, because the code checks "is logged in" but not "owns booking 42".
- Fix: **every handler that takes an ID checks the object belongs to the caller** (or the caller's role allows it). OWASP also suggests random, unguessable IDs (GUIDs) as an extra layer, not a fix.
- The example returns **404** for someone else's booking (checked: Ben gets 404 on Ada's booking, Ada gets 200), so it doesn't confirm the booking exists. RFC 9110 allows 404 for that.

### Property-level authorization (API3)
- **Excessive data exposure:** don't `return dbRow`; pick the fields to return (checked: only `depositMinor`, `id`, `slotId`, `status`; no `owner`).
- **Mass assignment:** don't copy the request body into the record. The example's PATCH allows only `status: "cancelled"`; a body trying to set `depositMinor` gets **422** pointing at `#/depositMinor` (checked).

### Resource consumption and business flows (API4, API6)
- Limit body size (413), page size (400), timeouts (topic 04), and **rate-limit** per client: **429** with `Retry-After` (checked: requests 4 and 5 in the window get 429, `retry-after: 60`).
- API6 uses a booking-style example: an attacker could **reserve all the available time slots** without paying. Defences it lists include rate limits, device fingerprinting and human detection. For bookings: hold slots only briefly until a deposit is paid, and cap unpaid holds per client (my application of it).

### CORS (MDN)
- The **browser** enforces it, not the server: it hides cross-origin responses from page scripts unless the server allows them. Server-to-server calls and curl ignore CORS, so **CORS isn't access control**. Authenticate anyway (checked: an unlisted origin still gets a 200, just without `Access-Control-Allow-Origin`).
- **Simple requests** (GET/HEAD/POST with simple headers and content types) go straight through. Others (JSON `Content-Type`, `Authorization`, PATCH/DELETE) trigger a **preflight** `OPTIONS` asking `Access-Control-Request-Method`/`-Headers`.
- The server answers with `Access-Control-Allow-Origin` (an explicit origin), `-Allow-Methods`, `-Allow-Headers`, optionally `-Max-Age` (checked).
- **With credentials** (cookies), `Access-Control-Allow-Origin: *` isn't allowed; echo an allowed origin, send `Access-Control-Allow-Credentials: true`, and add **`Vary: Origin`** so caches don't mix responses (checked).

### Cookies for sessions (MDN)
```
Set-Cookie: __Host-session=…; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600
```
- `Secure`: HTTPS only. `HttpOnly`: not readable from JavaScript (limits damage from XSS).
- `SameSite`: `Strict` (same-site only), `Lax` (also top-level navigations; some browsers default to it when the attribute is missing, so set it explicitly), `None` (any request; **requires `Secure`**). Helps against CSRF.
- `Max-Age` wins over `Expires` if both are set.
- The **`__Host-` prefix** requires `Secure`, `Path=/` and **no `Domain`**, so subdomains can't set or override it (checked: no `Domain` attribute).
- MDN: regenerate the session cookie on login and privilege changes (prevents session fixation).

## Traps
- Checking "logged in" but not "owns this object".
- `res.json(user)` with the password hash in it.
- `Object.assign(booking, req.body)`.
- Treating CORS as protection.
- `Access-Control-Allow-Origin: *` with cookies.
- Session cookie without `HttpOnly`/`Secure`.
- No rate limit on login.

## Practice questions

**Q1. What is BOLA and how do you prevent it?** Broken object-level authorization: the API trusts the ID in the URL without checking the caller may access that object. Check ownership or permission in every handler that loads an object by ID; unguessable IDs help but aren't the fix.

**Q2. Does CORS protect your API?** No. It's a browser rule about which pages can read responses. Non-browser clients ignore it, so the API still needs authentication and authorization.

**Q3. What cookie attributes would you set on a session cookie?** `Secure`, `HttpOnly`, `SameSite=Lax` (or `Strict`), a lifetime, ideally the `__Host-` prefix, and a new session ID on login.

**Q4. What is mass assignment?** Binding request fields straight onto a model so a client can set fields it shouldn't (role, price, owner). Allow-list the fields each endpoint may change.

**Q5. How would you stop one client hammering the API?** Per-client rate limits returning 429 with `Retry-After`, plus size and page limits and timeouts; tighter limits on login and expensive flows.

## Say it (about 40 seconds)
"I follow the OWASP API Top 10. The first risk is broken object-level authorization: every handler that loads something by ID checks it belongs to the caller, and I return 404 rather than reveal it exists. I return only the fields the client should see, and allow-list what a client can change, to stop mass assignment. Authentication failures get 401, and login gets rate limits. CORS is a browser rule, not security: I allow explicit origins, never a wildcard with credentials, and add Vary: Origin. Session cookies are Secure, HttpOnly and SameSite, and I rate-limit per client with 429 and Retry-After."
