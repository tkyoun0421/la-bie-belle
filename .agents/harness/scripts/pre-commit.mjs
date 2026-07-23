import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { findTask, loadIndex, repoRootFrom, validateIndex } from "./lib/index.mjs";
import { spawnSync } from "node:child_process";
import { blockedCommitPolicy } from "./lib/commit-policy.mjs";

const root = repoRootFrom(import.meta.url);
if (process.argv.includes("--self-test")) {
  const allowed = [
    "docs/phases/index.jsonl",
    ".agents/runs/P0-T09/attempts.json",
    ".agents/runs/P0-T09/manual-summary.md"
  ];
  if (blockedCommitPolicy("P0-T09", allowed)) throw new Error("차단 작업 커밋 정책이 허용 경로를 거부했습니다");
  if (!blockedCommitPolicy("P0-T09", [...allowed, "src/app.ts"])) throw new Error("차단 작업 커밋 정책이 제품 파일을 허용했습니다");
  console.log("커밋 전 가드 자체 검사를 통과했습니다");
  process.exit(0);
}
const { entries } = loadIndex(root);
const errors = validateIndex(entries);
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
const requestedTaskId = process.env.HARNESS_TASK_ID;
const active = requestedTaskId
  ? findTask(entries, requestedTaskId)
  : entries.find((entry) => entry.kind === "task" && entry.status === "in_progress");
if (!active) throw new Error("커밋하려면 진행 중인 작업 하나 또는 HARNESS_TASK_ID가 필요합니다");
if (active.status === "blocked") {
  const staged = spawnSync("git", ["diff", "--cached", "--name-only"], { cwd: root, encoding: "utf8" });
  if (staged.status !== 0) throw new Error(staged.stderr || "차단 작업의 스테이징 파일을 확인할 수 없습니다");
  const paths = staged.stdout.trim().split(/\r?\n/).filter(Boolean);
  const policyError = blockedCommitPolicy(active.id, paths);
  if (policyError) throw new Error(policyError);
  console.log(`${active.id}: 차단 상태 커밋 가드를 통과했습니다`);
  process.exit(0);
}
if (!["in_progress", "done"].includes(active.status)) throw new Error(`${active.id}: 커밋 상태는 in_progress, done 또는 보호된 blocked여야 합니다`);
const verification = join(root, ".agents/runs", active.id, "verification.json");
if (!existsSync(verification) || JSON.parse(readFileSync(verification, "utf8")).status !== "passed") {
  console.error(`${active.id}: 작업 검증 증거가 없거나 통과하지 못했습니다`);
  process.exit(1);
}
if (active.test_mode === "tdd") {
  const result = spawnSync("node", [".agents/harness/scripts/tdd-guard.mjs", "check", active.id], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) { process.stderr.write(result.stderr || result.stdout); process.exit(result.status || 1); }
}
console.log(`${active.id}: 커밋 전 가드를 통과했습니다`);
