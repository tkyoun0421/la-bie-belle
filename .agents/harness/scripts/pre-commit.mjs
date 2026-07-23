import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { findTask, loadIndex, repoRootFrom, validateIndex } from "./lib/index.mjs";
import { spawnSync } from "node:child_process";

const root = repoRootFrom(import.meta.url);
if (process.argv.includes("--self-test")) {
  console.log("pre-commit guard self-test ok");
  process.exit(0);
}
const { entries } = loadIndex(root);
const errors = validateIndex(entries);
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
const requestedTaskId = process.env.HARNESS_TASK_ID;
const active = requestedTaskId
  ? findTask(entries, requestedTaskId)
  : entries.find((entry) => entry.kind === "task" && entry.status === "in_progress");
if (!active) throw new Error("commit requires exactly one in_progress task or HARNESS_TASK_ID");
if (!["in_progress", "done"].includes(active.status)) throw new Error(`${active.id}: commit status must be in_progress or done`);
const verification = join(root, ".agents/runs", active.id, "verification.json");
if (!existsSync(verification) || JSON.parse(readFileSync(verification, "utf8")).status !== "passed") {
  console.error(`${active.id}: task verification evidence is missing or failed`);
  process.exit(1);
}
if (active.test_mode === "tdd") {
  const result = spawnSync("node", [".agents/harness/scripts/tdd-guard.mjs", "check", active.id], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) { process.stderr.write(result.stderr || result.stdout); process.exit(result.status || 1); }
}
console.log(`${active.id}: pre-commit guard passed`);
