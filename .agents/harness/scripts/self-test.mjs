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
  ".agents/harness/scripts/development-guard.mjs",
  ".agents/harness/scripts/skill-language-self-test.mjs",
  ".agents/harness/scripts/approval-workflow-self-test.mjs"
];
for (const path of required) if (!existsSync(join(root, path))) throw new Error(`필수 파일이 없습니다: ${path}`);
const checks = JSON.parse(readFileSync(join(root, ".agents/harness/checks.json"), "utf8"));
for (const id of ["harness-self-test", "development-guard", "skill-language-guard", "skill-validators", "approval-workflow", "index-schema", "hook-bypass", "task-contracts", "runner-contract-refusal", "tdd-guard-acceptance", "runner-lifecycle", "runner-blocked", "readiness-runner-capability", "harness-regression"]) {
  if (!Array.isArray(checks[id])) throw new Error(`필수 검사 항목이 없습니다: ${id}`);
}
const developmentGuard = spawnSync("node", [".agents/harness/scripts/development-guard.mjs", "--self-test"], { cwd: root, encoding: "utf8" });
if (developmentGuard.status !== 0) throw new Error(developmentGuard.stderr || developmentGuard.stdout || "개발 가드 자체 검사가 실패했습니다");
const approvalWorkflow = spawnSync("node", [".agents/harness/scripts/approval-workflow-self-test.mjs"], { cwd: root, encoding: "utf8" });
if (approvalWorkflow.status !== 0) throw new Error(approvalWorkflow.stderr || approvalWorkflow.stdout || "투트랙 승인 인계 자체 검사가 실패했습니다");
console.log("하네스 자체 검사를 통과했습니다");
