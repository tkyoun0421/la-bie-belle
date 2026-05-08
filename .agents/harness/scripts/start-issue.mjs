#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../..");
const harnessRoot = resolve(__dirname, "..");
const templatesRoot = join(harnessRoot, "templates");
const runsRoot = join(repoRoot, ".agents", "runs");

const args = process.argv.slice(2);
const issueNumber = Number(args[0]);
const titleArg = args.find((arg) => arg.startsWith("--title="));
const urlArg = args.find((arg) => arg.startsWith("--url="));
const force = args.includes("--force");

if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
  console.error("사용법: node .agents/harness/scripts/start-issue.mjs <issue-number> [--title=제목] [--url=URL] [--force]");
  process.exit(1);
}

const issueTitle = titleArg ? titleArg.slice("--title=".length) : `Issue #${issueNumber}`;
const issueUrl = urlArg ? urlArg.slice("--url=".length) : "";
const runId = `issue-${issueNumber}`;
const runDir = join(runsRoot, runId);
const now = new Date().toISOString();

if (existsSync(runDir) && !force) {
  console.error(`이미 실행 디렉터리가 있습니다: ${runDir}`);
  console.error("--force를 붙이면 누락된 템플릿만 보강합니다.");
  process.exit(1);
}

mkdirSync(runDir, { recursive: true });

const templateFiles = [
  "task-spec.md",
  "plan.md",
  "spec.md",
  "implementation-notes.md",
  "verification.md",
  "review.md",
  "review-score.json"
];

for (const file of templateFiles) {
  const target = join(runDir, file);
  if (existsSync(target) && !force) continue;

  let contents = readFileSync(join(templatesRoot, file), "utf8");
  if (file === "review-score.json") {
    contents = contents
      .replace("issue-000-review-attempt-1", `${runId}-review-attempt-1`)
      .replace("1970-01-01T00:00:00.000Z", now);
  }
  writeFileSync(target, contents);
}

const runRecordPath = join(runDir, "run-record.json");
if (!existsSync(runRecordPath) || force) {
  const runRecord = {
    run_id: runId,
    issue: {
      number: issueNumber,
      title: issueTitle,
      url: issueUrl
    },
    status: "planned",
    attempt: 1,
    artifacts: {
      task_spec: "task-spec.md",
      plan: "plan.md",
      spec: "spec.md",
      implementation_notes: "implementation-notes.md",
      verification: "verification.md",
      review_score: "review-score.json",
      review: "review.md"
    },
    changed_files: [],
    scores: [],
    created_at: now,
    updated_at: now
  };
  writeFileSync(runRecordPath, `${JSON.stringify(runRecord, null, 2)}\n`);
}

console.log(`생성 완료: ${runDir}`);
console.log("다음 단계: Planner가 task-spec.md와 plan.md를 채웁니다.");
