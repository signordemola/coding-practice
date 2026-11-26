// Topic 02: errors in Node and the process lifecycle — how each API reports errors, what crashes
// the process, unhandled rejections, exit codes, and graceful shutdown on SIGTERM.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { EventEmitter, once } from "node:events";
import { readFile } from "node:fs";
import { readFile as readFileP } from "node:fs/promises";

function runScript(code: string, flags: string[] = []) {
  return spawnSync(process.execPath, [...flags, "--input-type=module", "-e", code], { encoding: "utf8" });
}

// --- 1. Three ways errors arrive --------------------------------------------------------------
// a) Promise APIs reject → try/catch with await.
await assert.rejects(readFileP("/no/such/file"), (e: NodeJS.ErrnoException) => e.code === "ENOENT");
// b) Callback APIs pass the error FIRST (error-first callbacks).
const cbErr = await new Promise<NodeJS.ErrnoException | null>((resolve) => readFile("/no/such/file", (err) => resolve(err)));
assert.equal(cbErr?.code, "ENOENT");
// c) EventEmitters (streams, sockets) emit 'error'.
{
  const ee = new EventEmitter();
  const seen: string[] = [];
  ee.on("error", (e: Error) => seen.push(e.message));
  ee.emit("error", new Error("handled"));
  assert.deepEqual(seen, ["handled"]);
}

// --- 2. An 'error' event with no listener is thrown → the process crashes ----------------------
{
  const r = runScript(`
    import { EventEmitter } from "node:events";
    const ee = new EventEmitter();
    try {
      setImmediate(() => ee.emit("error", new Error("This will crash")));
    } catch { console.log("never caught here"); } // try/catch can't help: it's thrown later
  `);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /This will crash/);
  assert.doesNotMatch(r.stdout, /never caught/);
}

// --- 3. Unhandled promise rejections crash by default (--unhandled-rejections=throw, since v15) ---
{
  const crash = runScript(`Promise.reject(new Error("nobody handled me")); setTimeout(() => console.log("still alive"), 50);`);
  assert.equal(crash.status, 1);
  assert.match(crash.stderr, /nobody handled me/);
  assert.doesNotMatch(crash.stdout, /still alive/);

  const warned = runScript(`Promise.reject(new Error("x")); setTimeout(() => console.log("still alive"), 50);`, [
    "--unhandled-rejections=warn",
  ]);
  assert.equal(warned.status, 0); // only a warning in this mode
  assert.match(warned.stdout, /still alive/);
}

// --- 4. 'uncaughtException': last-resort cleanup, then exit (don't carry on) --------------------
{
  const r = runScript(`
    process.on("uncaughtException", (err) => {
      console.log("cleanup after:", err.message); // synchronous cleanup only
      process.exitCode = 1;                       // and let the process end
    });
    setImmediate(() => { throw new Error("boom"); });
  `);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /cleanup after: boom/);
}

// --- 5. Prefer process.exitCode over process.exit() ----------------------------------------------
{
  const r = runScript(`process.exitCode = 3; setTimeout(() => console.log("finished pending work"), 20);`);
  assert.equal(r.status, 3);
  assert.match(r.stdout, /finished pending work/); // exitCode lets pending work finish

  const hard = runScript(`setTimeout(() => console.log("never printed"), 20); process.exit(4);`);
  assert.equal(hard.status, 4);
  assert.doesNotMatch(hard.stdout, /never printed/); // exit() stops immediately
}

// --- 6. Error.cause keeps the original error when you wrap it ------------------------------------
{
  try {
    try {
      await readFileP("/no/such/config.json");
    } catch (err) {
      throw new Error("Could not load config", { cause: err });
    }
  } catch (err) {
    assert.ok(err instanceof Error);
    assert.equal((err.cause as NodeJS.ErrnoException).code, "ENOENT");
  }
}

// --- 7. Graceful shutdown: on SIGTERM, stop accepting, finish in-flight requests, then exit -------
const serverCode = (graceful: boolean) => `
  import http from "node:http";
  const server = http.createServer((req, res) => {
    setTimeout(() => res.end("done"), 300); // a slow in-flight request
  });
  server.listen(0, () => console.log("PORT " + server.address().port));
  ${
    graceful
      ? `process.on("SIGTERM", () => {
           server.close(() => { console.log("closed cleanly"); });  // stop new connections, wait for open ones
         });`
      : ""
  }
`;
async function shutdownDuringRequest(graceful: boolean) {
  const child = spawn(process.execPath, ["--input-type=module", "-e", serverCode(graceful)], { stdio: ["ignore", "pipe", "pipe"] });
  let out = "";
  child.stdout.on("data", (d: Buffer) => (out += d.toString()));
  while (!/PORT (\d+)/.test(out)) await once(child.stdout, "data");
  const port = Number(/PORT (\d+)/.exec(out)![1]);
  const pending = fetch(`http://127.0.0.1:${port}/`).then(
    async (r) => `${r.status} ${await r.text()}`,
    () => "request failed",
  );
  await new Promise((r) => setTimeout(r, 50)); // let the request reach the server
  child.kill("SIGTERM");
  const [code, signal] = (await once(child, "exit")) as [number | null, NodeJS.Signals | null];
  return { response: await pending, code, signal, out };
}
{
  const hard = await shutdownDuringRequest(false);
  assert.equal(hard.signal, "SIGTERM"); // default handler: killed straight away
  assert.equal(hard.response, "request failed"); // the in-flight request was cut off

  const soft = await shutdownDuringRequest(true);
  assert.equal(soft.response, "200 done"); // the in-flight request completed
  assert.equal(soft.code, 0);
  assert.match(soft.out, /closed cleanly/);
}

console.log("02 errors and the process: all checks passed");
