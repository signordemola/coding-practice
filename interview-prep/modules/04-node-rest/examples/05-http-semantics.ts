// Topic 05: HTTP semantics for REST — methods, status codes, Location, Allow, ETag and
// conditional requests, against the booking API in lib-booking-api.ts.
import assert from "node:assert/strict";
import { signIn, start } from "./lib-booking-api.ts";

const api = await start();
const token = await signIn(api.base, "ada");
const auth = { authorization: `Bearer ${token}` };
const json = { "content-type": "application/json" };

// --- 1. POST creates → 201 Created + Location ----------------------------------------------
const created = await fetch(`${api.base}/bookings`, {
  method: "POST",
  headers: { ...auth, ...json, "idempotency-key": crypto.randomUUID() },
  body: JSON.stringify({ slotId: "slot-001" }),
});
assert.equal(created.status, 201);
const location = created.headers.get("location")!;
assert.match(location, /^\/bookings\/[\w-]+$/);
const booking = (await created.json()) as { id: string; depositMinor: number };
assert.equal(booking.depositMinor, 2500); // the price comes from the server, not the client

// --- 2. GET reads; safe and idempotent: repeating changes nothing --------------------------------
const read1 = await fetch(`${api.base}${location}`, { headers: auth });
const read2 = await fetch(`${api.base}${location}`, { headers: auth });
assert.equal(read1.status, 200);
assert.deepEqual(await read1.json(), await read2.json());
const etag = read1.headers.get("etag")!;
assert.ok(etag.startsWith('"'));

// --- 3. Conditional GET: If-None-Match with the current ETag → 304, no body -----------------------
const notModified = await fetch(`${api.base}${location}`, { headers: { ...auth, "if-none-match": etag } });
assert.equal(notModified.status, 304);
assert.equal(await notModified.text(), "");

// --- 4. Lost-update protection: If-Match with a stale ETag → 412 Precondition Failed -------------
const stale = await fetch(`${api.base}${location}`, {
  method: "PATCH",
  headers: { ...auth, ...json, "if-match": '"not-the-current-etag"' },
  body: JSON.stringify({ status: "cancelled" }),
});
assert.equal(stale.status, 412);
const fresh = await fetch(`${api.base}${location}`, {
  method: "PATCH",
  headers: { ...auth, ...json, "if-match": etag },
  body: JSON.stringify({ status: "cancelled" }),
});
assert.equal(fresh.status, 200);
assert.notEqual(fresh.headers.get("etag"), etag); // the representation changed

// --- 5. DELETE: the effect is idempotent, the response doesn't have to be --------------------------
const del1 = await fetch(`${api.base}${location}`, { method: "DELETE", headers: auth });
const del2 = await fetch(`${api.base}${location}`, { method: "DELETE", headers: auth });
assert.equal(del1.status, 204); // done, nothing to send back
assert.equal(del2.status, 404); // already gone: same end state, different response (RFC 9110 allows that)

// --- 6. A method the resource doesn't support → 405 + Allow ------------------------------------------
const put = await fetch(`${api.base}/bookings`, { method: "PUT", headers: auth });
assert.equal(put.status, 405);
assert.equal(put.headers.get("allow"), "POST");

// --- 7. Client errors are distinguished by status code ----------------------------------------------
const noAuth = await fetch(`${api.base}/bookings/whatever`);
assert.equal(noAuth.status, 401);
assert.match(noAuth.headers.get("www-authenticate") ?? "", /^Bearer/); // required with 401

const wrongType = await fetch(`${api.base}/bookings`, {
  method: "POST",
  headers: { ...auth, "content-type": "text/plain", "idempotency-key": "k1" },
  body: "slot-002",
});
assert.equal(wrongType.status, 415); // a media type the resource doesn't accept

const malformed = await fetch(`${api.base}/bookings`, {
  method: "POST",
  headers: { ...auth, ...json, "idempotency-key": "k2" },
  body: "{not json",
});
assert.equal(malformed.status, 400); // syntax problem

const invalid = await fetch(`${api.base}/bookings`, {
  method: "POST",
  headers: { ...auth, ...json, "idempotency-key": "k3" },
  body: JSON.stringify({ slotId: "slot-999" }),
});
assert.equal(invalid.status, 422); // well-formed JSON, but the instruction can't be processed

await fetch(`${api.base}/bookings`, {
  method: "POST",
  headers: { ...auth, ...json, "idempotency-key": "k4" },
  body: JSON.stringify({ slotId: "slot-005" }),
});
const taken = await fetch(`${api.base}/bookings`, {
  method: "POST",
  headers: { ...auth, ...json, "idempotency-key": "k5" },
  body: JSON.stringify({ slotId: "slot-005" }),
});
assert.equal(taken.status, 409); // conflict with the current state: the slot is already booked

const tooBig = await fetch(`${api.base}/bookings`, {
  method: "POST",
  headers: { ...auth, ...json, "idempotency-key": "k6" },
  body: JSON.stringify({ slotId: "x".repeat(2000) }),
});
assert.equal(tooBig.status, 413); // body over the server's limit

const unknown = await fetch(`${api.base}/nope`);
assert.equal(unknown.status, 404);

await api.close();
console.log("05 http semantics: all checks passed");
