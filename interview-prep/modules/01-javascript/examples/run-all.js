// Runs every example in this folder and reports which passed.
// Run: node interview-prep/modules/01-javascript/examples/run-all.js
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";

const dir = import.meta.dirname;
const files = readdirSync(dir)
  .filter((f) => /^\d\d-.*\.(c?js)$/.test(f))
  .sort();

let failed = 0;
for (const file of files) {
  const flags = file.startsWith("12-") ? ["--expose-gc"] : [];
  const result = spawnSync(process.execPath, [...flags, file], { cwd: dir, encoding: "utf8" });
  const ok = result.status === 0;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${file}`);
  if (!ok) console.log(result.stderr || result.stdout);
}
console.log(`\n${files.length - failed}/${files.length} example files passed on Node ${process.versions.node}`);
console.log("11-dom-events.html runs in a browser: open it and every line should say PASS.");
process.exitCode = failed ? 1 : 0;
