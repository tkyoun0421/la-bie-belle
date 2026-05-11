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
  console.error("Usage: node .agents/harness/scripts/start-issue.mjs <issue-number> [--title=TITLE] [--url=URL] [--force]");
  process.exit(1);
}

const issueTitle = titleArg ? titleArg.slice("--title=".length) : `Issue #${issueNumber}`;
const issueUrl = urlArg ? urlArg.slice("--url=".length) : "";
const runId = `issue-${issueNumber}`;
const runDir = join(runsRoot, runId);
const now = new Date().toISOString();

if (existsSync(runDir) && !force) {
  console.error(`Run directory already exists: ${runDir}`);
  console.error("Use --force to restore missing templates and overwrite run metadata.");
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

const statePath = join(runDir, "state.json");
if (!existsSync(statePath) || force) {
  const runState = {
    run_id: runId,
    issue_number: issueNumber,
    stage: "planned",
    decision: null,
    priority: null,
    blocked: false,
    blockers: [],
    inbox_refs: [],
    dashboard_synced_at: null,
    updated_at: now
  };
  writeFileSync(statePath, `${JSON.stringify(runState, null, 2)}\n`);
}

console.log(`Created: ${runDir}`);
console.log("Next step: fill task-spec.md and plan.md.");
