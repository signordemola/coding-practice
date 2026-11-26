// Topic 12: modules, `import type`, Node type stripping, and TypeScript 6/7 defaults.
// The parts about tsc defaults run the repo's own tsc (7.0.2) on throwaway projects in a temp folder.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { area, type Shape } from "./lib-shapes.ts"; // inline `type`: erased, `area` stays
import type { Unit } from "./lib-shapes.ts"; // whole import erased

// --- 1. Imports: `.ts` extensions, type-only imports ------------------------------------
const sq: Shape = { kind: "square", size: 3 };
const unit: Unit = "cm";
assert.equal(`${area(sq)}${unit}`, "9cm");

// An erasable replacement for an enum: an `as const` object plus a union type of its values.
const Status = { Pending: "pending", Confirmed: "confirmed" } as const;
type Status = (typeof Status)[keyof typeof Status];
const st: Status = Status.Confirmed;
// @ts-expect-error TS2322 — only the listed values are allowed
const badStatus: Status = "paid";
assert.equal(st + badStatus, "confirmedpaid");

// --- 2. What Node does with TypeScript (type stripping) ------------------------------------
function runTs(code: string) {
  const r = spawnSync(process.execPath, ["--input-type=module-typescript", "--eval", code], { encoding: "utf8" });
  return { ok: r.status === 0, out: r.stdout.trim(), err: r.stderr };
}
// Types are replaced with whitespace; no type checking happens at all.
const wrongTypes = runTs('const n: number = "not a number" as any; console.log(typeof n)');
assert.deepEqual([wrongTypes.ok, wrongTypes.out], [true, "string"]);

// Syntax that needs code generation is refused.
for (const code of [
  "enum Direction { Up, Down }",
  "namespace A { export let x = 1 }",
  "class P { constructor(public x: number) {} }",
]) {
  const r = runTs(code);
  assert.equal(r.ok, false, code);
  assert.match(r.err, /ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX/, code);
}
// A namespace with only types is fine.
assert.equal(runTs("namespace T { export type A = string } const a: T.A = 'ok'; console.log(a)").out, "ok");

// Forgetting `type` on a type-only import: Node treats it as a VALUE import → runtime error.
const shapesUrl = new URL("./lib-shapes.ts", import.meta.url).href;
const missingType = runTs(`import { Shape } from "${shapesUrl}"; console.log("loaded")`);
assert.equal(missingType.ok, false);
assert.match(missingType.err, /does not provide an export named 'Shape'/);
assert.equal(runTs(`import type { Shape } from "${shapesUrl}"; console.log("loaded")`).out, "loaded");

// --- 3. TypeScript 6/7 defaults (the handbook still describes older ones) --------------------
const tsc = join(import.meta.dirname, "../../../../node_modules/typescript/bin/tsc");
function tscIn(tsconfig: object, source: string, args: string[] = ["-p", "."]) {
  const dir = mkdtempSync(join(tmpdir(), "ts-defaults-"));
  try {
    writeFileSync(join(dir, "tsconfig.json"), JSON.stringify(tsconfig));
    writeFileSync(join(dir, "a.ts"), source);
    const r = spawnSync(process.execPath, [tsc, ...args, "--pretty", "false"], { cwd: dir, encoding: "utf8" });
    return r.stdout + r.stderr;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const program = "function f(x) { return x; }\nconsole.log(process.version, f(1), new Set([1]).union(new Set([2])));\nexport {};\n";
const withEmptyConfig = tscIn({}, program);
assert.match(withEmptyConfig, /TS7006/); // strict is ON by default now (noImplicitAny)
assert.match(withEmptyConfig, /TS2591/); // "types" defaults to []: no Node globals until you add "types": ["node"]
assert.doesNotMatch(withEmptyConfig, /union/); // Set.prototype.union is typed: default lib is current ES (es2025)

// Options removed in 7.0 (deprecated in 6.0) are now hard errors.
assert.match(tscIn({ compilerOptions: { target: "es5" } }, "export {};"), /TS5108: Option 'target=ES5' has been removed/);
assert.match(tscIn({ compilerOptions: { baseUrl: "." } }, "export {};"), /TS5102: Option 'baseUrl' has been removed/);
assert.match(tscIn({ compilerOptions: { moduleResolution: "node10" } }, "export {};"), /TS5108/);
// `tsc file.ts` when a tsconfig.json is present is an error (use --ignoreConfig).
assert.match(tscIn({}, "export {};", ["a.ts"]), /TS5112/);

console.log("12 modules/tooling: all checks passed");
