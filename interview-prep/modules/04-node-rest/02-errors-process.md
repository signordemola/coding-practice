# 02. Errors, crashes, exit codes and graceful shutdown

**Sources (Node.js v26.13.1 API docs, from `nodejs/node` tag `v26.13.1`, 10 Nov 2026):**
[Errors: Error propagation and interception](https://nodejs.org/docs/latest-v26.x/api/errors.html#error-propagation-and-interception), "Common system errors" and "Exceptions vs. errors" (read in full) ·
[Process](https://nodejs.org/docs/latest-v26.x/api/process.html): `'uncaughtException'` and its warning, `'unhandledRejection'`, signal events, `process.exit()`, `process.exitCode` (those sections in full) ·
[CLI: `--unhandled-rejections`](https://nodejs.org/docs/latest-v26.x/api/cli.html#--unhandled-rejectionsmode) ·
[HTTP: `server.close()`](https://nodejs.org/docs/latest-v26.x/api/http.html#serverclosecallback)

**Run the checks:** `node interview-prep/modules/04-node-rest/examples/run-all.js` (this topic: `examples/02-errors-process.ts`)

`try`/`catch`/`finally` and `Error.cause` in general are in module 01, topic 06.

## Explain

### How Node APIs report errors
| API style | How you get the error | Example |
|---|---|---|
| Synchronous | It **throws**; use `try`/`catch` | `fs.readFileSync` |
| Promise-based | It **rejects**; `await` in `try`/`catch` or `.catch` | `fs/promises` |
| Callback-based | **Error-first callback**: `(err, data)`; check `err` first | `fs.readFile` |
| EventEmitter / stream | An **`'error'` event** | sockets, streams, `req`/`res` |

- **An `'error'` event with no listener is thrown**, so the process crashes, unless an `'uncaughtException'` handler exists. `try`/`catch` around the call can't help, because it's thrown later (checked: exit code 1).
- System errors carry `error.code`: `ENOENT`, `EACCES`, `EADDRINUSE`, `ECONNREFUSED`, `ECONNRESET`, `EPIPE`, `ETIMEDOUT`, `EMFILE`… Check the code, not the message.
- Wrap errors with `new Error("Could not load config", { cause: err })` to keep the original (checked).

### Unhandled rejections crash the process
- Since Node 15 the default is `--unhandled-rejections=throw`: a rejected promise with no handler is raised as an uncaught exception, and the process exits (checked: exit 1, later timers never run). `warn` only warns (checked).
- So every promise needs a handler: `await` inside `try`/`catch`, or `.catch()`.

### `'uncaughtException'` is for cleanup, not for carrying on
The docs are blunt: it's a crude last resort; after it the app is in an **undefined state**, and "**it is not safe to resume normal operation**". Do synchronous cleanup, then exit, and let an **external process manager restart** the app (checked: the handler logs and exits with code 1).

### Exiting
- `process.exit(code)` stops **immediately**, even with pending async work, and can cut off output still being written (checked: a pending timer never prints).
- Usually you don't need it: set **`process.exitCode`** and let the event loop empty (checked: exit code 3 *after* pending work).

### Signals and graceful shutdown
- Signals arrive as process events (`'SIGTERM'`, `'SIGINT'`). On non-Windows platforms, `SIGTERM` and `SIGINT` have default handlers that exit with code 128 + the signal number. **Adding a listener removes that default behaviour.**
- `server.close()` stops accepting new connections and closes idle ones (since Node 19 that includes idle keep-alive connections), while open requests finish.
- The pattern (my combination of those two facts; checked):
```js
process.on("SIGTERM", () => {
  server.close(() => {          // stop new connections; wait for in-flight requests
    // close the database pool, flush logs…
  });                           // the loop then empties and the process exits 0
});
```
  Without a handler, the in-flight request was cut off. With it, the request completed and the process exited 0 (checked).
- Hosting platforms send `SIGTERM` before stopping a container. That's general knowledge here, not from these pages; module 08 (Docker) will source it.

## Traps
- A stream or socket without an `'error'` listener.
- Fire-and-forget promises (`sendEmail()` without `await` or `.catch`).
- `process.on('uncaughtException', log)` and keep serving.
- `process.exit()` right after writing a response or a log line.
- Catching errors by matching message text instead of `error.code`.

## Practice questions

**Q1. Three ways Node APIs report errors?** Throwing (sync), rejected promises, error-first callbacks, and `'error'` events on emitters and streams.

**Q2. What happens to an unhandled promise rejection in current Node?** By default (`throw` mode, since v15) it's raised as an uncaught exception and the process exits, unless an `'unhandledRejection'` handler deals with it.

**Q3. Is it OK to log in `uncaughtException` and continue?** No. The docs say the process is in an undefined state; clean up synchronously and exit, and let a supervisor restart it.

**Q4. `process.exit(1)` vs `process.exitCode = 1`?** `exit()` stops at once, possibly losing pending writes. `exitCode` sets the code for when the process ends naturally.

**Q5. How do you shut down an HTTP server gracefully?** Handle `SIGTERM`: call `server.close()` so no new connections are accepted and in-flight requests finish, close other resources, and let the process exit.

## Say it (about 40 seconds)
"Node reports errors in four ways: sync code throws, promises reject, callbacks get the error as the first argument, and emitters like streams emit an `'error'` event, which crashes the process if nobody listens. Unhandled promise rejections also crash it by default, so every promise gets a handler. `uncaughtException` is only for last-moment cleanup: the docs say it's not safe to keep running, so you exit and let a process manager restart. For shutdowns I handle `SIGTERM` with `server.close()`, so in-flight requests finish, and I set `process.exitCode` rather than calling `process.exit()`."
