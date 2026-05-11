#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../..");
const runsRoot = join(repoRoot, ".agents", "runs");
const apply = process.argv.includes("--apply");

function readJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

function artifactStage(runDir) {
  if (existsSync(join(runDir, "review-score.json")) && existsSync(join(runDir, "review.md"))) return "reviewed";
  if (existsSync(join(runDir, "verification.md"))) return "verified";
  if (existsSync(join(runDir, "implementation-notes.md"))) return "implemented";
  if (existsSync(join(runDir, "spec.md"))) return "specified";
  if (existsSync(join(runDir, "task-spec.md")) && existsSync(join(runDir, "plan.md"))) return "planned";
  return "unplanned";
}

function isInsideRunsRoot(path) {
  const relativePath = relative(resolve(runsRoot), resolve(path));
  return relativePath !== "" && !relativePath.startsWith("..") && !isAbsolute(relativePath);
}

const runDirs = existsSync(runsRoot)
  ? readdirSync(runsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("issue-"))
      .map((entry) => join(runsRoot, entry.name))
      .sort()
  : [];

const candidates = [];
const skipped = [];

for (const runDir of runDirs) {
  const runRecord = readJson(join(runDir, "run-record.json"));
  const reviewScore = readJson(join(runDir, "review-score.json"));
  const state = readJson(join(runDir, "state.json"));
  const stage = state?.stage || artifactStage(runDir);
  const decision = state?.decision || reviewScore?.decision || null;
  const terminal = ["PASS", "REWORK", "FAIL"].includes(decision);

  const item = {
    run_id: runRecord?.run_id || basename(runDir),
    issue_number: runRecord?.issue?.number ?? null,
    stage,
    decision,
    path: runDir
  };

  if (stage === "reviewed" && terminal) {
    candidates.push({
      ...item,
      reason: "review artifacts and terminal decision exist"
    });
  } else {
    skipped.push({
      ...item,
      reason: "run is not reviewed with a terminal decision"
    });
  }
}

if (apply) {
  for (const candidate of candidates) {
    if (!isInsideRunsRoot(candidate.path)) {
      throw new Error(`Refusing to delete outside runs root: ${candidate.path}`);
    }
    rmSync(candidate.path, { recursive: true, force: false });
  }
}

console.log(JSON.stringify({ apply, candidates, skipped }, null, 2));
