// Topic 07: API security basics — 401 vs 403/404, object-level authorization, mass assignment,
// CORS, session cookie attributes, and rate limiting.
import assert from "node:assert/strict";
import { signIn, start } from "./lib-booking-api.ts";

const json = { "content-type": "application/json" };
const api = await start();
const ada = await signIn(api.base, "ada");
const ben = await signIn(api.base, "ben");

const created = await fetch(`${api.base}/bookings`, {
  method: "POST",
  headers: { authorization: `Bearer ${ada}`, ...json, "idempotency-key": crypto.randomUUID() },
  body: JSON.stringify({ slotId: "slot-001" }),
});
const location = created.headers.get("location")!;

// --- 1. Authentication: no or bad credentials → 401 ---------------------------------------------
assert.equal((await fetch(`${api.base}${location}`)).status, 401);
assert.equal((await fetch(`${api.base}${location}`, { headers: { authorization: "Bearer forged" } })).status, 401);

// --- 2. Object-level authorization (BOLA): signed in, but not your booking -------------------------
const asBen = await fetch(`${api.base}${location}`, { headers: { authorization: `Bearer ${ben}` } });
assert.equal(asBen.status, 404); // same answer as "doesn't exist": doesn't reveal that it does
const asAda = await fetch(`${api.base}${location}`, { headers: { authorization: `Bearer ${ada}` } });
assert.equal(asAda.status, 200);

// --- 3. Return only chosen fields; accept only allowed fields -------------------------------------
const body = (await asAda.json()) as Record<string, unknown>;
assert.deepEqual(Object.keys(body).sort(), ["depositMinor", "id", "slotId", "status"]);
assert.equal("owner" in body, false); // internal field not exposed
const massAssign = await fetch(`${api.base}${location}`, {
  method: "PATCH",
  headers: { authorization: `Bearer ${ada}`, ...json, "if-match": asAda.headers.get("etag")! },
  body: JSON.stringify({ status: "cancelled", depositMinor: 0 }), // 🔴 trying to change the price
});
assert.equal(massAssign.status, 422);
assert.match(await massAssign.text(), /#\/depositMinor/);

// --- 4. CORS: the browser asks first; only the allowed origin gets permission ------------------------
const preflight = await fetch(`${api.base}/bookings`, {
  method: "OPTIONS",
  headers: { origin: "https://app.example", "access-control-request-method": "POST", "access-control-request-headers": "content-type" },
});
assert.equal(preflight.status, 204);
assert.equal(preflight.headers.get("access-control-allow-origin"), "https://app.example"); // explicit, not "*"
assert.equal(preflight.headers.get("access-control-allow-credentials"), "true");
assert.match(preflight.headers.get("access-control-allow-methods") ?? "", /POST/);
assert.match(preflight.headers.get("vary") ?? "", /Origin/);
const evil = await fetch(`${api.base}/slots`, { headers: { origin: "https://evil.example" } });
assert.equal(evil.headers.get("access-control-allow-origin"), null); // no permission → the browser blocks the read
assert.equal(evil.status, 200); // NOTE: the server still answered. CORS is enforced by browsers, not servers.

// --- 5. Session cookie attributes --------------------------------------------------------------------
const login = await fetch(`${api.base}/sessions`, { method: "POST", headers: json, body: JSON.stringify({ user: "cy" }) });
const cookie = login.headers.get("set-cookie") ?? "";
for (const attr of ["__Host-session=", "Path=/", "Secure", "HttpOnly", "SameSite=Lax", "Max-Age=3600"]) {
  assert.ok(cookie.includes(attr), `cookie has ${attr}`);
}
assert.ok(!/Domain=/i.test(cookie)); // __Host- cookies must not set Domain

// --- 6. Rate limiting → 429 + Retry-After --------------------------------------------------------------
{
  const limited = await start({ rateLimitPerMinute: 3 });
  const statuses: number[] = [];
  for (let i = 0; i < 5; i++) statuses.push((await fetch(`${limited.base}/slots`)).status);
  assert.deepEqual(statuses, [200, 200, 200, 429, 429]);
  const r = await fetch(`${limited.base}/slots`);
  assert.equal(r.headers.get("retry-after"), "60");
  await limited.close();
}

await api.close();
console.log("07 security: all checks passed");
