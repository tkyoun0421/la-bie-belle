#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../..");
const runsRoot = join(repoRoot, ".agents", "runs");
const historyDir = join(repoRoot, ".agents", "harness", "history");
const historyPath = join(historyDir, "runs.json");
const apply = process.argv.includes("--apply");

function readJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function stageFromArtifacts(runDir) {
  if (existsSync(join(runDir, "review-score.json")) && existsSync(join(runDir, "review.md"))) return "reviewed";
  if (existsSync(join(runDir, "verification.md"))) return "verified";
  if (existsSync(join(runDir, "implementation-notes.md"))) return "green";
  if (existsSync(join(runDir, "spec.md"))) return "specified";
  if (existsSync(join(runDir, "task-spec.md")) && existsSync(join(runDir, "plan.md"))) return "planned";
  return "unplanned";
}

function labelForCategory(id) {
  const labels = {
    requirement_fulfillment: "Requirement fulfillment",
    scope_control: "Scope control",
    implementation_quality: "Implementation quality",
    verification_sufficiency: "Verification sufficiency",
    risk_and_safety: "Risk and safety",
    requirement_interpretation: "Requirement interpretation",
    plan_appropriateness: "Plan appropriateness",
    context_usage: "Context usage",
    handoff_quality: "Handoff quality",
    task_spec_quality: "Task spec quality",
    context_injection_quality: "Context injection quality",
    role_handoff_quality: "Role handoff quality",
    verification_gate_quality: "Verification gate quality",
    scoring_rubric_quality: "Scoring rubric quality",
    record_and_dashboard_quality: "Record and dashboard quality"
  };
  return labels[id] || id;
}

function normalizeDeduction(category, deduction) {
  const fallbackPoints = Math.max(0, category.max_score - category.score);
  if (typeof deduction === "string") {
    return {
      category: labelForCategory(category.id),
      points: fallbackPoints,
      reason: deduction
    };
  }

  return {
    category: labelForCategory(category.id),
    points: deduction?.points ?? fallbackPoints,
    reason: deduction?.reason || "",
    follow_up: deduction?.follow_up || null,
    severity: deduction?.severity || null
  };
}

function compactRun(runDir) {
  const record = readJson(join(runDir, "run-record.json"));
  if (!record) return null;

  const state = readJson(join(runDir, "state.json"));
  const reviewScore = readJson(join(runDir, record.artifacts?.review_score || "review-score.json"));
  const harnessHealth = readJson(join(runDir, record.artifacts?.harness_health_score || "harness-health-score.json"));
  const stage = state?.stage || stageFromArtifacts(runDir);
  const decision = state?.decision || reviewScore?.decision || null;
  const terminal = ["PASS", "REWORK", "FAIL"].includes(decision);

  if (stage !== "reviewed" || !terminal) return null;

  const categories = (reviewScore?.categories || []).map((category) => ({
    id: category.id,
    label: labelForCategory(category.id),
    score: category.score,
    max: category.max_score
  }));

  const deductions = (reviewScore?.categories || []).flatMap((category) =>
    (category.deductions || []).map((deduction) => normalizeDeduction(category, deduction))
  );

  return {
    run_id: record.run_id,
    issue_number: record.issue.number,
    title: record.issue.title,
    stage,
    decision,
    total_score: reviewScore?.total_score ?? null,
    harness_score: harnessHealth?.total_score ?? null,
    priority: state?.priority ?? null,
    blocked: state?.blocked ?? false,
    blockers: state?.blockers ?? [],
    inbox_refs: state?.inbox_refs ?? [],
    attempt: record.attempt || 1,
    updated_at: state?.updated_at || record.updated_at || record.created_at,
    archived_at: new Date().toISOString(),
    source: {
      type: "local-run",
      path: `.agents/runs/${record.run_id}`
    },
    strengths: reviewScore?.strengths || [],
    weaknesses: reviewScore?.weaknesses || [],
    deductions,
    categories,
    harness_health: harnessHealth ? {
      total_score: harnessHealth.total_score,
      categories: harnessHealth.categories || []
    } : null
  };
}

const runDirs = existsSync(runsRoot)
  ? readdirSync(runsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("issue-"))
      .map((entry) => join(runsRoot, entry.name))
      .sort()
  : [];

const compacted = runDirs.map(compactRun).filter(Boolean);
const history = readJson(historyPath) || { schema_version: 1, runs: [] };
const archived = [];

for (const run of compacted) {
  const index = history.runs.findIndex((item) => item.run_id === run.run_id);
  if (index === -1) {
    archived.push({ action: "add", run_id: run.run_id, issue_number: run.issue_number });
    if (apply) history.runs.push(run);
  } else {
    archived.push({ action: "update", run_id: run.run_id, issue_number: run.issue_number });
    if (apply) history.runs[index] = run;
  }
}

history.runs.sort((a, b) => b.issue_number - a.issue_number);

if (apply) {
  mkdirSync(historyDir, { recursive: true });
  writeJson(historyPath, history);
}

console.log(JSON.stringify({ apply, archived }, null, 2));
