# 03. Streams and backpressure

**Sources:**
- nodejs.org Learn (read in full): [Backpressuring in Streams](https://nodejs.org/en/learn/modules/backpressuring-in-streams) (benchmark tables skimmed) · [The Node.js Event emitter](https://nodejs.org/en/learn/asynchronous-work/the-nodejs-event-emitter)
- Node.js v26.13.1 API: [`stream.getDefaultHighWaterMark()`](https://nodejs.org/docs/latest-v26.x/api/stream.html#streamgetdefaulthighwatermarkobjectmode) · [`events.once()`](https://nodejs.org/docs/latest-v26.x/api/events.html#eventsonceemitter-name-options) (those entries)

**Run the checks:** `node interview-prep/modules/04-node-rest/examples/run-all.js` (this topic: `examples/03-streams.ts`)

## Explain

### Why streams
Process data piece by piece instead of loading it all into memory. `req` and `res` in an HTTP server, files, sockets and `zlib` are all streams. They're also EventEmitters (`on`, `once`, `emit`, `off`), so errors arrive as `'error'` events (topic 02).

### Backpressure
- When the consumer is slower than the producer (writing to disk is slower than reading), data piles up in memory. The guide's benchmark: ignoring backpressure while gzipping a 9 GB file used about **1.5 GB** of memory instead of about **88 MB**, and strained the garbage collector.
- **`writable.write()` returns `false`** once the buffer passes the stream's **`highWaterMark`**. That means "stop". When the buffer empties, the stream emits **`'drain'`**: carry on (checked: with a 10-byte mark, the second 5-byte write returns `false`).
- `.pipe()` and `pipeline` handle this for you. If you write by hand: stop on `false`, `await once(stream, 'drain')`, continue (checked: the buffer stays bounded).
- **Default `highWaterMark`:** 64 KiB for byte streams on Linux and macOS (16 KiB on Windows), and 16 objects in object mode, since Node 22 (checked). The Learn page still says "16kb", which is outdated.
- Rules from the guide: never `push()` unless asked; never keep writing after `false`; respect `push()`'s return in a custom `_read()`. `readable.on('data', d => writable.write(d))` ignores backpressure.

### `pipeline`, not `.pipe()`
- `.pipe()` doesn't destroy the other streams when one fails, so you can leak open streams (checked: the source stays open after the destination errors).
- **`stream.pipeline`** (or `pipeline` from `node:stream/promises` with `await`) forwards errors, destroys every stream and tells you when it's done (checked: rejects with "disk full" and the source is destroyed).
```js
import { pipeline } from "node:stream/promises";
await pipeline(fs.createReadStream(src), zlib.createGzip(), fs.createWriteStream(dest));
```

### Reading a whole stream
- `await text(stream)` / `json(stream)` from **`node:stream/consumers`** (checked).
- `for await (const chunk of stream)` (checked).
- For HTTP request bodies, **cap the size** while reading (topic 04).

### One trap found while writing the checks
`await once(stream, 'close')` **rejects if the stream emits `'error'` first** (documented on `events.once()`). Listen with `stream.on('close', …)` if you expect an error.

## Traps
- Ignoring `write()`'s return value in a loop.
- `.pipe()` chains without error handling.
- Reading an upload fully into memory with no size limit.
- `events.once` on a stream that may error.

## Practice questions

**Q1. What is backpressure and how do Node streams handle it?** It's the consumer pushing back when it can't keep up. `write()` returns `false` when the buffer is past `highWaterMark`, the producer pauses, and `'drain'` says when to resume. `pipe` and `pipeline` do this automatically.

**Q2. Why `pipeline` over `.pipe()`?** `pipeline` forwards errors from any stream, destroys all of them on failure and gives you completion; `.pipe()` doesn't clean up.

**Q3. What's `highWaterMark` by default?** 64 KiB for byte streams (16 KiB on Windows) and 16 objects in object mode, as of Node 22.

**Q4. How would you return a large CSV export without high memory use?** Stream it: read rows in chunks (from a database cursor, say) and write them to the response with `pipeline`, so backpressure keeps memory flat. (The database side is module 06.)

## Say it (about 30 seconds)
"Streams process data in chunks, which keeps memory flat for big files or responses. The key idea is backpressure: when the destination is slower, `write()` returns false once the buffer passes the high-water mark, 64 KiB by default now, and the producer waits for `'drain'`. `pipe` and `pipeline` handle that for me, and I use `pipeline` because it also forwards errors and destroys every stream on failure, which `.pipe()` doesn't."
