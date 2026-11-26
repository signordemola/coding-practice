// Topic 04: the node:http server — request and response objects, reading a body safely,
// timeouts, and closing the server.
import assert from "node:assert/strict";
import http from "node:http";
import { text } from "node:stream/consumers";

async function listen(server: http.Server) {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("no port");
  return `http://127.0.0.1:${address.port}`;
}

// --- 1. What the handler receives ------------------------------------------------------------
{
  let seen: { method?: string | undefined; url?: string | undefined; header?: string | string[] | undefined; body?: string } = {};
  const server = http.createServer(async (req, res) => {
    seen = {
      method: req.method,
      url: req.url, // path + query only: no scheme, host or port
      header: req.headers["x-booking-source"], // header names are always lower-case here
      body: await text(req), // the body is a readable stream
    };
    res.end("ok"); // no statusCode set → 200
  });
  const base = await listen(server);
  const r = await fetch(`${base}/bookings?date=2026-12-01`, {
    method: "POST",
    headers: { "X-Booking-Source": "Mobile" },
    body: "hello",
  });
  assert.equal(r.status, 200);
  assert.deepEqual(seen, { method: "POST", url: "/bookings?date=2026-12-01", header: "Mobile", body: "hello" });
  await new Promise((resolve) => server.close(resolve));
}

// --- 2. Status and headers must be set before the body -------------------------------------------
{
  let error = "";
  const server = http.createServer((_req, res) => {
    res.write("body first");
    try {
      res.setHeader("content-type", "application/json"); // too late: headers were already sent
    } catch (e) {
      error = (e as NodeJS.ErrnoException).code ?? "";
    }
    res.end();
  });
  const base = await listen(server);
  await (await fetch(base)).text();
  assert.equal(error, "ERR_HTTP_HEADERS_SENT");
  await new Promise((resolve) => server.close(resolve));
}

// --- 3. Default timeouts on this Node version ---------------------------------------------------
{
  const server = http.createServer();
  assert.equal(server.requestTimeout, 300_000); // whole request must arrive within 5 minutes → 408
  assert.equal(server.headersTimeout, 60_000); // headers within min(requestTimeout, 60 s) → 408
  const major = Number(process.versions.node.split(".")[0]);
  // keepAliveTimeout: 5 s up to Node 26; the docs for the next major (27) change it to 65 s.
  assert.equal(server.keepAliveTimeout, major >= 27 ? 65_000 : 5_000);
  assert.equal(server.timeout, 0); // no socket inactivity timeout by default
}

// --- 4. An unhandled 'error' on a request stream would crash the process -------------------------
// (topic 02 shows the crash itself). The booking API in lib-booking-api.ts adds req.on("error").

// --- 5. Closing: server.close() stops NEW connections and waits for open requests -------------------
{
  const server = http.createServer((_req, res) => {
    setTimeout(() => res.end("slow but finished"), 100);
  });
  const base = await listen(server);
  const inFlight = fetch(base).then((r) => r.text());
  await new Promise((r) => setTimeout(r, 20));
  const closed = new Promise<void>((resolve) => server.close(() => resolve()));
  assert.equal(server.listening, false); // no longer accepting
  await assert.rejects(fetch(base)); // a new connection is refused...
  assert.equal(await inFlight, "slow but finished"); // ...but the open request finishes
  await closed;
}

console.log("04 http server: all checks passed");
