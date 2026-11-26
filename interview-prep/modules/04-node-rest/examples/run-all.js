// Checks every example in this folder:
//   1. tsc type-checks all .ts files with the repo's strict settings (Node only strips types).
//   2. Node runs each NN-*.ts file; its asserts must pass.
// Run from the repo root after `pnpm install`:
//   node interview-prep/modules/04-node-rest/examples/run-all.js
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const dir = import.meta.dirname;
const tsc = join(dir, "../../../../node_modules/typescript/bin/tsc"); // the repo's own TypeScript
let failed = 0;

const check = spawnSync(process.execPath, [tsc, "-p", dir, "--pretty", "false"], { encoding: "utf8" });
console.log(`${check.status === 0 ? "PASS" : "FAIL"}  tsc type-check`);
if (check.status !== 0) {
  failed++;
  console.log(check.stdout);
}

for (const file of readdirSync(dir).filter((f) => /^\d\d-.*\.ts$/.test(f)).sort()) {
  const result = spawnSync(process.execPath, [file], { cwd: dir, encoding: "utf8", timeout: 60_000 });
  const ok = result.status === 0;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  node ${file}`);
  if (!ok) console.log(result.stderr || result.stdout);
}
console.log(`\n${failed === 0 ? "All checks passed" : `${failed} check(s) failed`} (Node ${process.versions.node})`);
process.exitCode = failed ? 1 : 0;
