import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { repoRootFrom } from "./lib/index.mjs";

const root = repoRootFrom(import.meta.url);
const required = [
  ".agents/harness/config.json",
  ".agents/harness/checks.json",
  ".agents/harness/scripts/validate-index.mjs",
  ".agents/harness/scripts/run.mjs",
  ".agents/harness/scripts/contract-self-test.mjs",
  ".agents/harness/scripts/tdd-guard-self-test.mjs",
  ".agents/harness/scripts/runner-lifecycle-self-test.mjs",
  ".agents/harness/scripts/tdd-guard.mjs",
  ".agents/harness/scripts/verify-task.mjs",
  ".agents/harness/scripts/pre-commit.mjs",
  ".agents/harness/scripts/development-guard.mjs"
];
for (const path of required) if (!existsSync(join(root, path))) throw new Error(`missing ${path}`);
const checks = JSON.parse(readFileSync(join(root, ".agents/harness/checks.json"), "utf8"));
for (const id of ["harness-self-test", "development-guard", "skill-validators", "index-schema", "hook-bypass", "task-contracts", "runner-contract-refusal", "tdd-guard-acceptance", "runner-lifecycle", "runner-blocked", "readiness-runner-capability", "harness-regression"]) {
  if (!Array.isArray(checks[id])) throw new Error(`missing check ${id}`);
}
const developmentGuard = spawnSync("node", [".agents/harness/scripts/development-guard.mjs", "--self-test"], { cwd: root, encoding: "utf8" });
if (developmentGuard.status !== 0) throw new Error(developmentGuard.stderr || developmentGuard.stdout || "development guard self-test failed");
console.log("harness self-test ok");
