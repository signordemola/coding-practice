// Topic 06: API design — problem details (RFC 9457), idempotency keys, and pagination limits.
import assert from "node:assert/strict";
import { signIn, start } from "./lib-booking-api.ts";

const json = { "content-type": "application/json" };

// --- 1. Errors as application/problem+json ----------------------------------------------------
{
  const api = await start();
  const token = await signIn(api.base, "ada");
  const r = await fetch(`${api.base}/bookings`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, ...json, "idempotency-key": crypto.randomUUID() },
    body: JSON.stringify({ slotId: 42 }),
  });
  assert.equal(r.status, 422);
  assert.equal(r.headers.get("content-type"), "application/problem+json");
  const p = (await r.json()) as { type: string; status: number; title: string; errors: { pointer: string }[] };
  assert.equal(p.status, r.status); // the body's status must match the real status
  assert.equal(p.type, "https://api.example/problems/validation");
  assert.deepEqual(p.errors.map((e) => e.pointer), ["#/slotId"]); // which field, as a JSON Pointer
  await api.close();
}

// --- 2. Idempotency keys: a retried POST doesn't book twice -------------------------------------
{
  const api = await start();
  const token = await signIn(api.base, "ada");
  const post = (key: string | undefined, slotId: string) =>
    fetch(`${api.base}/bookings`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, ...json, ...(key ? { "idempotency-key": key } : {}) },
      body: JSON.stringify({ slotId }),
    });

  // Missing key on an operation that requires one → 400.
  assert.equal((await post(undefined, "slot-010")).status, 400);

  // Same key + same payload: the second call replays the first result.
  const key = crypto.randomUUID();
  const first = await post(key, "slot-010");
  const retry = await post(key, "slot-010"); // e.g. the client timed out and tried again
  assert.equal(first.status, 201);
  assert.equal(retry.status, 201);
  assert.equal(retry.headers.get("location"), first.headers.get("location"));
  assert.equal(api.stats.bookingsCreated, 1); // ONE booking, not two

  // Same key + different payload → 422 (the key is tied to that request).
  assert.equal((await post(key, "slot-011")).status, 422);

  // Without keys, two identical POSTs are two requests: the second hits the business rule.
  assert.equal((await post(crypto.randomUUID(), "slot-012")).status, 201);
  assert.equal((await post(crypto.randomUUID(), "slot-012")).status, 409);
  await api.close();
}

// --- 3. A retry that arrives while the first request is still running → 409 -------------------------
{
  const api = await start({ slowCreateMs: 150 }); // e.g. waiting on a payment provider
  const token = await signIn(api.base, "ada");
  const key = crypto.randomUUID();
  const send = () =>
    fetch(`${api.base}/bookings`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, ...json, "idempotency-key": key },
      body: JSON.stringify({ slotId: "slot-020" }),
    });
  const original = send();
  await new Promise((r) => setTimeout(r, 30));
  const concurrent = await send();
  assert.equal(concurrent.status, 409); // "a request is outstanding for this key"
  assert.equal((await original).status, 201);
  assert.equal(api.stats.bookingsCreated, 1);
  await api.close();
}

// --- 4. Keys are scoped per user: another user's key can't fetch someone else's result ---------------
{
  const api = await start();
  const ada = await signIn(api.base, "ada");
  const ben = await signIn(api.base, "ben");
  const key = "same-key-by-coincidence";
  const send = (token: string, slotId: string) =>
    fetch(`${api.base}/bookings`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, ...json, "idempotency-key": key },
      body: JSON.stringify({ slotId }),
    });
  const a = await send(ada, "slot-030");
  const b = await send(ben, "slot-031");
  assert.equal(a.status, 201);
  assert.equal(b.status, 201); // processed as Ben's own request, not a replay of Ada's
  assert.notEqual(a.headers.get("location"), b.headers.get("location"));
  await api.close();
}

// --- 5. Pagination with a capped page size (OWASP API4) --------------------------------------------
{
  const api = await start();
  type Page = { data: { id: string }[]; nextCursor: string | null };
  const seen: string[] = [];
  let cursor: string | null = null;
  let pages = 0;
  do {
    const r = await fetch(`${api.base}/slots?limit=100${cursor ? `&cursor=${cursor}` : ""}`);
    const page = (await r.json()) as Page;
    seen.push(...page.data.map((s) => s.id));
    cursor = page.nextCursor;
    pages++;
  } while (cursor);
  assert.equal(pages, 3); // 250 slots in pages of 100
  assert.equal(new Set(seen).size, 250); // no duplicates, nothing skipped
  assert.equal((await fetch(`${api.base}/slots?limit=5000`)).status, 400); // a huge page is refused
  await api.close();
}

console.log("06 api design: all checks passed");
