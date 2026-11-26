// A small booking API on plain node:http, used by examples 04–07. Not run on its own.
// Generic example data only (a studio with slots), no real client code.
//
// Routes:
//   POST   /sessions                → issue a bearer token (and a session cookie, for topic 07)
//   GET    /slots?limit=&cursor=    → paginated list, limit capped
//   POST   /bookings                → create; needs auth + Idempotency-Key
//   GET    /bookings/:id            → read own booking; ETag / If-None-Match
//   PATCH  /bookings/:id            → change status; needs If-Match
//   DELETE /bookings/:id            → cancel
import { createHash, randomUUID } from "node:crypto";
import http, { type IncomingMessage, type ServerResponse } from "node:http";

export type Booking = { id: string; owner: string; slotId: string; status: "confirmed" | "cancelled"; depositMinor: number };
type Problem = { type?: string; title: string; detail?: string; [extension: string]: unknown };
type StoredResult = { status: number; headers: Record<string, string>; body: string };

const MAX_BODY_BYTES = 1024;
const MAX_PAGE = 100;
const ALLOWED_ORIGIN = "https://app.example";
const DEPOSIT_MINOR = 2500; // decided by the server, never taken from the client

export function createApp(options: { slowCreateMs?: number; rateLimitPerMinute?: number } = {}) {
  const slots = Array.from({ length: 250 }, (_, i) => ({ id: `slot-${String(i + 1).padStart(3, "0")}` }));
  const tokens = new Map<string, string>(); // token → user
  const bookings = new Map<string, Booking>();
  const takenSlots = new Set<string>();
  const idempotency = new Map<string, { fingerprint: string; result: StoredResult | "in-progress" }>();
  const requestsThisMinute = new Map<string, number>();
  const stats = { bookingsCreated: 0 };

  function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
    const text = body === undefined ? "" : JSON.stringify(body);
    res.writeHead(status, { ...(text ? { "content-type": "application/json" } : {}), ...headers });
    res.end(text);
  }
  // RFC 9457 problem details: status in the body must equal the HTTP status.
  function problem(res: ServerResponse, status: number, p: Problem, headers: Record<string, string> = {}) {
    const text = JSON.stringify({ type: "about:blank", status, ...p });
    res.writeHead(status, { "content-type": "application/problem+json", ...headers });
    res.end(text);
  }
  function etagOf(b: Booking) {
    return `"${createHash("sha256").update(JSON.stringify(b)).digest("base64url").slice(0, 16)}"`;
  }
  function publicView(b: Booking) {
    // Choose the fields to return (OWASP API3), rather than dumping the stored object.
    return { id: b.id, slotId: b.slotId, status: b.status, depositMinor: b.depositMinor };
  }

  async function readJson(req: IncomingMessage, res: ServerResponse): Promise<unknown | undefined> {
    if (!(req.headers["content-type"] ?? "").startsWith("application/json")) {
      problem(res, 415, { title: "Unsupported Media Type", detail: "Send application/json." });
      return undefined;
    }
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      size += (chunk as Buffer).length;
      if (size > MAX_BODY_BYTES) {
        problem(res, 413, { title: "Content Too Large", detail: `Max ${MAX_BODY_BYTES} bytes.` });
        req.resume();
        return undefined;
      }
      chunks.push(chunk as Buffer);
    }
    try {
      return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      problem(res, 400, { title: "Bad Request", detail: "Malformed JSON." });
      return undefined;
    }
  }

  function authenticate(req: IncomingMessage, res: ServerResponse): string | undefined {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const user = tokens.get(token);
    if (!user) {
      // RFC 9110: a 401 MUST include WWW-Authenticate.
      problem(res, 401, { title: "Unauthorized", detail: "Sign in first." }, { "www-authenticate": 'Bearer realm="bookings"' });
      return undefined;
    }
    return user;
  }

  function cors(req: IncomingMessage, res: ServerResponse) {
    const origin = req.headers.origin;
    if (origin === ALLOWED_ORIGIN) {
      res.setHeader("access-control-allow-origin", origin); // an explicit origin, never "*" with credentials
      res.setHeader("access-control-allow-credentials", "true");
    }
    res.setHeader("vary", "Origin"); // the response depends on the Origin header
  }

  const server = http.createServer(async (req, res) => {
    req.on("error", () => {}); // request stream errors would otherwise be thrown
    const url = new URL(req.url ?? "/", "http://localhost");
    const method = req.method ?? "GET";
    cors(req, res);

    // CORS preflight
    if (method === "OPTIONS") {
      if (req.headers.origin !== ALLOWED_ORIGIN) return problem(res, 403, { title: "Forbidden", detail: "Origin not allowed." });
      res.writeHead(204, {
        "access-control-allow-methods": "GET, POST, PATCH, DELETE",
        "access-control-allow-headers": "Authorization, Content-Type, Idempotency-Key, If-Match",
        "access-control-max-age": "600",
      });
      return res.end();
    }

    // Simple fixed-window rate limit per client (OWASP API4; 429 + Retry-After per MDN).
    if (options.rateLimitPerMinute) {
      const client = req.headers.authorization ?? req.socket.remoteAddress ?? "unknown";
      const count = (requestsThisMinute.get(client) ?? 0) + 1;
      requestsThisMinute.set(client, count);
      if (count > options.rateLimitPerMinute) {
        return problem(res, 429, { title: "Too Many Requests" }, { "retry-after": "60" });
      }
    }

    // POST /sessions — sign in (credentials checking is out of scope for this example)
    if (url.pathname === "/sessions") {
      if (method !== "POST") return problem(res, 405, { title: "Method Not Allowed" }, { allow: "POST" });
      const body = (await readJson(req, res)) as { user?: unknown } | undefined;
      if (body === undefined) return;
      if (typeof body.user !== "string" || body.user === "") {
        return problem(res, 422, { title: "Unprocessable Content", errors: [{ detail: "is required", pointer: "#/user" }] });
      }
      const token = randomUUID();
      tokens.set(token, body.user);
      // A session cookie with the attributes MDN recommends for session cookies.
      res.setHeader("set-cookie", `__Host-session=${token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600`);
      return send(res, 201, { token });
    }

    // GET /slots — paginated
    if (url.pathname === "/slots") {
      if (method !== "GET") return problem(res, 405, { title: "Method Not Allowed" }, { allow: "GET" });
      const limit = Number(url.searchParams.get("limit") ?? "20");
      if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE) {
        return problem(res, 400, { title: "Bad Request", detail: `limit must be 1–${MAX_PAGE}` });
      }
      const cursor = url.searchParams.get("cursor");
      const start = cursor ? slots.findIndex((s) => s.id === cursor) + 1 : 0;
      const page = slots.slice(start, start + limit).map((s) => ({ ...s, available: !takenSlots.has(s.id) }));
      const last = page.at(-1);
      const nextCursor = last && start + limit < slots.length ? last.id : null;
      return send(res, 200, { data: page, nextCursor });
    }

    // /bookings and /bookings/:id
    const match = /^\/bookings(?:\/([\w-]+))?$/.exec(url.pathname);
    if (!match) return problem(res, 404, { title: "Not Found" });
    const id = match[1];

    if (!id) {
      if (method !== "POST") return problem(res, 405, { title: "Method Not Allowed" }, { allow: "POST" });
      const user = authenticate(req, res);
      if (!user) return;
      const key = req.headers["idempotency-key"];
      if (typeof key !== "string" || key === "") {
        return problem(res, 400, { type: "https://api.example/problems/idempotency", title: "Idempotency-Key is missing" });
      }
      const body = (await readJson(req, res)) as { slotId?: unknown } | undefined;
      if (body === undefined) return;
      const storeKey = `${user}:${key}`; // scoped to the user, so keys can't reach other users' results
      const fingerprint = createHash("sha256").update(JSON.stringify(body)).digest("hex");
      const seen = idempotency.get(storeKey);
      if (seen) {
        if (seen.fingerprint !== fingerprint) {
          return problem(res, 422, { type: "https://api.example/problems/idempotency", title: "Idempotency-Key is already used" });
        }
        if (seen.result === "in-progress") {
          return problem(res, 409, { type: "https://api.example/problems/idempotency", title: "A request is outstanding for this Idempotency-Key" });
        }
        res.writeHead(seen.result.status, seen.result.headers); // replay the original result
        return res.end(seen.result.body);
      }
      if (typeof body.slotId !== "string" || !slots.some((s) => s.id === body.slotId)) {
        return problem(res, 422, {
          type: "https://api.example/problems/validation",
          title: "Your request is not valid.",
          errors: [{ detail: "must be an existing slot id", pointer: "#/slotId" }],
        });
      }
      idempotency.set(storeKey, { fingerprint, result: "in-progress" });
      if (options.slowCreateMs) await new Promise((r) => setTimeout(r, options.slowCreateMs)); // e.g. a payment call
      let result: StoredResult;
      if (takenSlots.has(body.slotId)) {
        const p = { type: "about:blank", status: 409, title: "Conflict", detail: "That slot is already booked." };
        result = { status: 409, headers: { "content-type": "application/problem+json" }, body: JSON.stringify(p) };
      } else {
        takenSlots.add(body.slotId);
        const booking: Booking = { id: randomUUID(), owner: user, slotId: body.slotId, status: "confirmed", depositMinor: DEPOSIT_MINOR };
        bookings.set(booking.id, booking);
        stats.bookingsCreated++;
        result = {
          status: 201,
          headers: { "content-type": "application/json", location: `/bookings/${booking.id}`, etag: etagOf(booking) },
          body: JSON.stringify(publicView(booking)),
        };
      }
      idempotency.set(storeKey, { fingerprint, result });
      res.writeHead(result.status, result.headers);
      return res.end(result.body);
    }

    // /bookings/:id
    if (!["GET", "PATCH", "DELETE"].includes(method)) {
      return problem(res, 405, { title: "Method Not Allowed" }, { allow: "GET, PATCH, DELETE" });
    }
    const user = authenticate(req, res);
    if (!user) return;
    const booking = bookings.get(id);
    // Object-level authorization (OWASP API1): someone else's booking looks exactly like a missing one.
    if (!booking || booking.owner !== user) return problem(res, 404, { title: "Not Found" });

    if (method === "GET") {
      const etag = etagOf(booking);
      if (req.headers["if-none-match"] === etag) {
        res.writeHead(304, { etag });
        return res.end();
      }
      return send(res, 200, publicView(booking), { etag });
    }
    if (method === "PATCH") {
      const ifMatch = req.headers["if-match"];
      if (!ifMatch) return problem(res, 428, { title: "Precondition Required", detail: "Send If-Match with the ETag you last saw." });
      if (ifMatch !== etagOf(booking)) return problem(res, 412, { title: "Precondition Failed", detail: "The booking changed since you read it." });
      const body = (await readJson(req, res)) as Record<string, unknown> | undefined;
      if (body === undefined) return;
      const unknownFields = Object.keys(body).filter((k) => k !== "status");
      if (unknownFields.length > 0 || body["status"] !== "cancelled") {
        // Only allow the fields a client may change (no mass assignment, OWASP API3).
        return problem(res, 422, {
          title: "Unprocessable Content",
          errors: [...unknownFields.map((k) => ({ detail: "cannot be changed", pointer: `#/${k}` })), ...(body["status"] !== "cancelled" ? [{ detail: "only 'cancelled' is allowed", pointer: "#/status" }] : [])],
        });
      }
      booking.status = "cancelled";
      takenSlots.delete(booking.slotId);
      return send(res, 200, publicView(booking), { etag: etagOf(booking) });
    }
    // DELETE
    bookings.delete(booking.id);
    takenSlots.delete(booking.slotId);
    res.writeHead(204);
    return res.end();
  });

  return { server, stats };
}

/** Starts the app on a random free port and returns its base URL plus a close() helper. */
export async function start(options?: Parameters<typeof createApp>[0]) {
  const app = createApp(options);
  await new Promise<void>((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  const address = app.server.address();
  if (address === null || typeof address === "string") throw new Error("no port");
  return {
    base: `http://127.0.0.1:${address.port}`,
    stats: app.stats,
    server: app.server,
    close: () => new Promise<void>((resolve) => app.server.close(() => resolve())),
  };
}

export async function signIn(base: string, user: string) {
  const r = await fetch(`${base}/sessions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ user }) });
  return ((await r.json()) as { token: string }).token;
}
