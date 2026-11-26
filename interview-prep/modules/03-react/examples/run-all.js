// Builds and runs every example in this folder.
//   1. tsc type-checks the .ts/.tsx files (strict) and compiles them into .build/
//      (Node can strip types but can't run JSX, so these files need a compile step).
//   2. Node runs each compiled NN-*.js file; its asserts must pass.
// Run (after `pnpm install` in this folder): node interview-prep/modules/03-react/examples/run-all.js
import { spawnSync } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const dir = import.meta.dirname;
const tsc = join(dir, "node_modules/typescript/bin/tsc");
let failed = 0;

rmSync(join(dir, ".build"), { recursive: true, force: true });
const build = spawnSync(process.execPath, [tsc, "-p", dir, "--pretty", "false"], { encoding: "utf8" });
console.log(`${build.status === 0 ? "PASS" : "FAIL"}  tsc type-check + build`);
if (build.status !== 0) {
  console.log(build.stdout);
  process.exit(1);
}

const files = readdirSync(join(dir, ".build")).filter((f) => /^\d\d-.*\.js$/.test(f)).sort();
for (const file of files) {
  const result = spawnSync(process.execPath, [file], { cwd: join(dir, ".build"), encoding: "utf8" });
  const ok = result.status === 0;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  node ${file}`);
  if (!ok) console.log(result.stderr || result.stdout);
}
console.log(`\n${failed === 0 ? "All checks passed" : `${failed} file(s) failed`} (Node ${process.versions.node})`);
process.exitCode = failed ? 1 : 0;
