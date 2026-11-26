// Topic 03: streams and backpressure — write() returning false, 'drain', pipeline vs pipe,
// the default highWaterMark, and reading a stream with consumers / async iteration.
import assert from "node:assert/strict";
import { once } from "node:events";
import { platform } from "node:os";
import { getDefaultHighWaterMark, PassThrough, pipeline as pipelineCb, Readable, Writable } from "node:stream";
import { text } from "node:stream/consumers";
import { pipeline } from "node:stream/promises";

// --- 1. Default buffer sizes (raised in Node 22) --------------------------------------------
assert.equal(getDefaultHighWaterMark(true), 16); // objects
assert.equal(getDefaultHighWaterMark(false), platform() === "win32" ? 16384 : 65536); // bytes

// --- 2. Backpressure: write() returns false once the buffer passes highWaterMark ---------------
{
  const slow = new Writable({
    highWaterMark: 10,
    write(_chunk, _enc, done) {
      setTimeout(done, 5); // a slow consumer (like a disk)
    },
  });
  const results = ["12345", "67890", "abc"].map((c) => slow.write(c));
  assert.deepEqual(results, [true, false, false]); // 5 bytes fits; 10 reaches the mark → "stop writing"
  await once(slow, "drain"); // the buffer emptied: safe to write again
  assert.equal(slow.write("more"), true);
}

// The polite producer: stop when write() says false, resume on 'drain'.
async function writeAll(dest: Writable, chunks: string[]) {
  let waits = 0;
  for (const chunk of chunks) {
    if (!dest.write(chunk)) {
      waits++;
      await once(dest, "drain");
    }
  }
  dest.end();
  return waits;
}
{
  let maxBuffered = 0;
  const sink = new Writable({
    highWaterMark: 1024,
    write(_c, _e, done) {
      maxBuffered = Math.max(maxBuffered, sink.writableLength);
      setImmediate(done);
    },
  });
  const waits = await writeAll(sink, Array.from({ length: 200 }, () => "x".repeat(100)));
  assert.ok(waits > 0);
  assert.ok(maxBuffered <= 1024 + 100, `buffer stayed bounded (${maxBuffered} bytes)`); // memory stays flat
}

// --- 3. pipeline forwards errors and destroys every stream; .pipe() does not -------------------
function failingDestination() {
  return new Writable({
    write(_c, _e, done) {
      done(new Error("disk full"));
    },
  });
}
{
  const source = Readable.from(["a", "b", "c"]);
  await assert.rejects(pipeline(source, new PassThrough(), failingDestination()), /disk full/);
  assert.equal(source.destroyed, true); // cleaned up
}
{
  const source = new PassThrough();
  const dest = failingDestination();
  dest.on("error", () => {}); // .pipe() leaves error handling to you
  source.pipe(dest);
  const closed = new Promise((resolve) => dest.on("close", resolve)); // (events.once would reject on 'error')
  source.write("a");
  await closed;
  assert.equal(source.destroyed, false); // 🔴 the source is left open (a leak in real code)
  source.destroy();
}
{
  // The callback form of pipeline does the same.
  const err = await new Promise<Error | null | undefined>((resolve) =>
    pipelineCb(Readable.from(["x"]), failingDestination(), (e) => resolve(e)),
  );
  assert.match(String(err), /disk full/);
}

// --- 4. Reading a whole stream ----------------------------------------------------------------
assert.equal(await text(Readable.from(["Hello, ", "World"])), "Hello, World"); // node:stream/consumers
{
  const chunks: string[] = [];
  for await (const chunk of Readable.from(["a", "b", "c"])) chunks.push(String(chunk)); // async iteration
  assert.deepEqual(chunks, ["a", "b", "c"]);
}

console.log("03 streams: all checks passed");
