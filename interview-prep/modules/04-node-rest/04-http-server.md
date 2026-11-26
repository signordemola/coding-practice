# 04. Building an HTTP server with `node:http`

**Sources:**
- nodejs.org Learn (read in full): [Anatomy of an HTTP Transaction](https://nodejs.org/en/learn/http/anatomy-of-an-http-transaction)
- Node.js v26.13.1 API: [HTTP `Server`](https://nodejs.org/docs/latest-v26.x/api/http.html#class-httpserver): `close`, `closeAllConnections`, `closeIdleConnections`, `headersTimeout`, `requestTimeout`, `timeout`, `keepAliveTimeout`, `keepAliveTimeoutBuffer`, `maxHeadersCount`, `maxRequestsPerSocket`, `[Symbol.asyncDispose]` (those entries)
- OWASP API Security Top 10 2023: [API4 Unrestricted Resource Consumption](https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/)

**Run the checks:** `node interview-prep/modules/04-node-rest/examples/run-all.js` (this topic: `examples/04-http-server.ts`; the full API in `examples/lib-booking-api.ts` is used by topics 05–07)

## Explain

### The handler
```js
const server = http.createServer((req, res) => { … }); // called once per request
server.listen(3000);
```
- `createServer`'s callback is a listener for the server's `'request'` event (the server is an EventEmitter).
- **`req`** (an `IncomingMessage`, a readable stream):
  - `method`;
  - `url`: path and query only, no scheme, host or port (checked);
  - `headers`: **always lower-case** names (checked). Repeated headers are joined or overwritten; `rawHeaders` keeps the original.
- **The body is a stream.** Collect `Buffer` chunks and `Buffer.concat` them at `'end'`, or use `text(req)` from `node:stream/consumers` (checked).
- **`res`** (a `ServerResponse`, a writable stream):
  - status defaults to **200** (checked);
  - `setHeader()` (case-insensitive, last value wins) or `writeHead(status, headers)`, then `write()`/`end()`.
  - **Status and headers must come before the body**: setting a header after writing throws `ERR_HTTP_HEADERS_SENT` (checked).
- Add `'error'` listeners on `req` and `res`; an unhandled stream error is thrown (topic 02).
- "Routing" is checking `method` and the path; frameworks like Express do this at scale (the guide names `express` and `router`).

### Read bodies defensively (my rules, following OWASP API4 and "Don't Block the Event Loop")
The booking API in the examples:
1. checks `Content-Type` → **415** if it isn't JSON;
2. counts bytes while reading → **413** over 1 KB;
3. parses inside `try` → **400** for malformed JSON;
4. validates the parsed value → **422** with field pointers (topic 06).

All four are checked in topic 05.

### Timeouts (defaults on Node 26)
| Setting | Default | What happens |
|---|---|---|
| `requestTimeout` | 300 000 ms | The whole request must arrive in time, otherwise **408** and the connection closes |
| `headersTimeout` | min(`requestTimeout`, 60 000) ms | Same, for the headers |
| `keepAliveTimeout` | **5 000 ms** on Node 26 (the docs for the next major, 27, raise it to 65 000) | Idle keep-alive sockets are closed after this |
| `timeout` | 0 (none) | Socket inactivity timeout |

The docs say `requestTimeout`/`headersTimeout` must stay non-zero to protect against denial-of-service when there's no reverse proxy in front (checked on Node 22, which has the same values).

### Closing
- `server.close()`: stop accepting new connections and close idle ones; open requests finish (checked: the in-flight request completes, a new one is refused).
- `closeAllConnections()`: force-close everything (call it after `close()`).
- `server[Symbol.asyncDispose]()` (Node 24.2+) returns a promise.
- Graceful shutdown on `SIGTERM` is topic 02.

### Testing an API without a framework
Start the server on **port 0** (the OS picks a free port), read the port from `server.address()`, call it with the built-in `fetch`, and close it at the end. Every check in this module works this way. Mocking and the test runner itself are module 05.

## Traps
- Assuming `req.headers["Content-Type"]` (it's lower-case).
- Writing the body before setting headers.
- Unlimited body reading (`JSON.parse` on whatever arrives).
- Setting `requestTimeout` to 0.
- Forgetting `res.end()`, so the request hangs until a timeout.

## Practice questions

**Q1. Walk through handling a POST with JSON in plain Node.** Check the method and path; check `Content-Type`; read the body stream with a size limit; `JSON.parse` in `try` (400 on failure); validate (422); do the work; set status and headers; `end()` the JSON response.

**Q2. Why are headers lower-case in `req.headers`?** Node normalises names so lookups don't depend on how the client capitalised them.

**Q3. What do `requestTimeout` and `headersTimeout` protect against?** Slow clients holding connections open (slowloris-style). After the limit Node answers 408 and closes the connection.

**Q4. How do you test an HTTP handler end to end without deploying?** Listen on port 0, `fetch` the real URL, assert on status, headers and body, then close the server.

## Say it (about 35 seconds)
"With `node:http`, the handler gets a request, a readable stream with the method, path and lower-cased headers, and a response, a writable stream where I set status and headers before writing the body. Because the body is a stream, I read it defensively: check the content type, cap the size, parse in a try, validate, and answer 415, 413, 400 or 422 accordingly. Node has request and header timeouts on by default against slow clients, and `server.close()` lets in-flight requests finish when shutting down. For tests I start the server on port zero and hit it with fetch."
