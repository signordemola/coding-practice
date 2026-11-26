// Checks every example in this folder in three steps:
//   1. tsc type-checks all files. Every `// @ts-expect-error` must really hide an error
//      (an unused one is itself an error), so the "this doesn't compile" lines are proven.
//   2. Error codes: each directive says which error it expects, e.g. `// @ts-expect-error TS2322`.
//      The files are copied with the directives blanked out and type-checked again, and each
//      claimed code must appear on the line below its directive.
//   3. Node runs each file (type stripping: no compile step) and its asserts must pass.
//      Files named *.tsc-only.ts are type-checked only.
// Run from the repo root after `pnpm install`:
//   node interview-prep/modules/02-typescript/examples/run-all.js
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const dir = import.meta.dirname;
const tsc = join(dir, "../../../../node_modules/typescript/bin/tsc"); // the repo's own TypeScript (pnpm install)
const files = readdirSync(dir).filter((f) => /^\d\d-.*\.ts$/.test(f)).sort();
let failed = 0;

function typecheck(project) {
  return spawnSync(process.execPath, [tsc, "-p", project, "--pretty", "false"], { encoding: "utf8" });
}

// 1. Type-check with the directives in place.
const first = typecheck(dir);
console.log(`${first.status === 0 ? "PASS" : "FAIL"}  tsc type-check (${files.length} files)`);
if (first.status !== 0) {
  failed++;
  console.log(first.stdout);
}

// 2. Blank out the directives and check each claimed error code.
const tmp = join(dir, ".errcheck");
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp);
writeFileSync(join(tmp, "tsconfig.json"), JSON.stringify({ extends: "../tsconfig.json", include: ["*.ts"] }));
const expected = []; // { file, line, code }
for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts"))) { // helper modules too
  const lines = readFileSync(join(dir, file), "utf8").split("\n");
  lines.forEach((text, i) => {
    const m = text.match(/^\s*\/\/ @ts-expect-error (TS\d+)/);
    if (m) {
      expected.push({ file, line: i + 2, code: m[1] }); // 1-based line of the next line
      lines[i] = "//";
    } else if (/^\s*\/\/ @ts-expect-error/.test(text)) { // a directive must name its code
      expected.push({ file, line: i + 2, code: "(no code given)" });
    }
  });
  writeFileSync(join(tmp, file), lines.join("\n"));
}
const second = typecheck(tmp);
rmSync(tmp, { recursive: true, force: true });
const actual = new Set(
  [...second.stdout.matchAll(/^(\S+?\.ts)\((\d+),\d+\): error (TS\d+)/gm)].map((m) => `${basename(m[1])}:${m[2]}:${m[3]}`),
);
const wrong = expected.filter((e) => !actual.has(`${e.file}:${e.line}:${e.code}`));
console.log(`${wrong.length === 0 ? "PASS" : "FAIL"}  error codes (${expected.length} expected errors)`);
if (wrong.length) {
  failed++;
  for (const e of wrong) console.log(`  ${e.file} line ${e.line}: expected ${e.code}`);
  console.log(second.stdout);
}

// 3. Run each file with Node (files named *.tsc-only.ts hold syntax Node can't run).
for (const file of files.filter((f) => !f.endsWith(".tsc-only.ts"))) {
  const result = spawnSync(process.execPath, [file], { cwd: dir, encoding: "utf8" });
  const ok = result.status === 0;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  node ${file}`);
  if (!ok) console.log(result.stderr || result.stdout);
}

console.log(`\n${failed === 0 ? "All checks passed" : `${failed} check(s) failed`} (Node ${process.versions.node})`);
process.exitCode = failed ? 1 : 0;
