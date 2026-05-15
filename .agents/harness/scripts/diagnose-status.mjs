#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../..");
const runsRoot = join(repoRoot, ".agents", "runs");
const inboxPath = join(repoRoot, ".agents", "inbox.md");
const dashboardPath = join(repoRoot, ".agents", "harness", "dashboard", "data", "runs.js");

function readJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

function readText(path) {
  if (!existsSync(path)) return "";
  return readFileSync(path, "utf8");
}

function fileInfo(path) {
  if (!existsSync(path)) return { exists: false, bytes: 0, updated_at: null };
  const stats = statSync(path);
  return {
    exists: true,
    bytes: stats.size,
    updated_at: stats.mtime.toISOString(),
    complete: true,
    template: false,
    quality_warnings: []
  };
}

function markdownArtifactInfo(path) {
  const info = fileInfo(path);
  if (!info.exists) return { ...info, complete: false, template: false, quality_warnings: [] };

  const text = readText(path).trim();
  const placeholderLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line === "작성 필요." || line === "- 작성 필요.");
  const template = !text || placeholderLines.length > 0;

  return {
    ...info,
    complete: !template,
    template,
    quality_warnings: template ? ["artifact appears to be an unfilled template"] : []
  };
}

function reviewScoreArtifactInfo(path) {
  const info = fileInfo(path);
  if (!info.exists) return { ...info, complete: false, template: false, quality_warnings: [] };

  const warnings = [];
  const score = readJson(path);
  const hasEvidence = (score?.categories || []).some(
    (category) => (category.evidence || []).length > 0 || (category.deductions || []).length > 0
  );
  const template =
    score?.score_id === "issue-000-review-attempt-1" ||
    score?.scored_at === "1970-01-01T00:00:00.000Z" ||
    String(score?.recommended_next_action || "").includes("작성 필요") ||
    (score?.decision === "FAIL" && score?.total_score === 0 && !hasEvidence);

  if (template) warnings.push("review score appears to be an unfilled template");

  return {
    ...info,
    complete: !template,
    template,
    quality_warnings: warnings
  };
}

function parseDashboard() {
  if (!existsSync(dashboardPath)) return { exists: false, generated_at: null, run_count: 0 };

  const text = readText(dashboardPath);
  const match = text.match(/window\.AI_HARNESS_RUNS\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);
  if (!match) {
    return { exists: true, generated_at: null, run_count: 0, parse_error: "dashboard data assignment not found" };
  }

  try {
    const data = JSON.parse(match[1]);
    return {
      exists: true,
      generated_at: data.generated_at ?? null,
      run_count: Array.isArray(data.runs) ? data.runs.length : 0
    };
  } catch (error) {
    return { exists: true, generated_at: null, run_count: 0, parse_error: error.message };
  }
}

function parseInbox() {
  const text = readText(inboxPath);
  const lines = text.split(/\r?\n/);
  const unresolved = [];
  const completed = [];

  for (const line of lines) {
    const match = line.match(/^- \[( |x)\] (.+)$/);
    if (!match) continue;

    const item = parseInboxItem(match[1] === "x", match[2]);

    if (item.checked) {
      completed.push(item);
    } else {
      unresolved.push(item);
    }
  }

  return {
    exists: existsSync(inboxPath),
    unresolved_count: unresolved.length,
    completed_count: completed.length,
    unresolved,
    completed
  };
}

function parseInboxItem(checked, raw) {
  const segments = raw.split("|").map((segment) => segment.trim()).filter(Boolean);
  const item = {
    checked,
    raw,
    date: null,
    id: null,
    source: null,
    current_issue: null,
    type: null,
    tag: null,
    content: null
  };

  for (const segment of segments) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(segment)) {
      item.date = segment;
      continue;
    }

    if (segment === "auto" || segment === "manual") {
      item.source = segment;
      continue;
    }

    const separatorIndex = segment.indexOf(":");
    if (separatorIndex === -1) continue;

    const key = segment.slice(0, separatorIndex).trim().replace(/\s+/g, "_");
    const value = segment.slice(separatorIndex + 1).trim();

    if (key === "id") item.id = value;
    if (key === "current_issue") item.current_issue = value;
    if (key === "type") item.type = value;
    if (key === "tag") item.tag = value;
    if (key === "content") item.content = value;
  }

  return item;
}

function artifactStage(artifacts) {
  if (artifacts.review_score.complete && artifacts.review.complete) return "reviewed";
  if (artifacts.verification.complete) return "verified";
  if (artifacts.implementation_notes.complete) return "implemented";
  if (artifacts.spec.complete) return "specified";
  if (artifacts.task_spec.complete && artifacts.plan.complete) return "planned";
  return "unplanned";
}

function diagnoseRun(runDir) {
  const runRecordPath = join(runDir, "run-record.json");
  const statePath = join(runDir, "state.json");
  const runRecord = readJson(runRecordPath);
  const state = readJson(statePath);

  const artifacts = {
    task_spec: markdownArtifactInfo(join(runDir, "task-spec.md")),
    plan: markdownArtifactInfo(join(runDir, "plan.md")),
    spec: markdownArtifactInfo(join(runDir, "spec.md")),
    implementation_notes: markdownArtifactInfo(join(runDir, "implementation-notes.md")),
    verification: markdownArtifactInfo(join(runDir, "verification.md")),
    review_score: reviewScoreArtifactInfo(join(runDir, "review-score.json")),
    review: markdownArtifactInfo(join(runDir, "review.md"))
  };

  const reviewScore = artifacts.review_score.complete ? readJson(join(runDir, "review-score.json")) : null;
  const inferredStage = artifactStage(artifacts);
  const decision = reviewScore?.decision ?? state?.decision ?? null;
  const cleanupCandidate = inferredStage === "reviewed" && ["PASS", "REWORK", "FAIL"].includes(decision);
  const warnings = [];
  const artifactWarnings = Object.entries(artifacts).flatMap(([name, artifact]) =>
    (artifact.quality_warnings || []).map((warning) => `${name}: ${warning}`)
  );

  if (!state) warnings.push("missing state.json");
  if (state && state.run_id !== runRecord?.run_id) warnings.push("state run_id differs from run-record run_id");
  if (state?.stage && state.stage !== inferredStage) warnings.push(`state stage '${state.stage}' differs from artifact stage '${inferredStage}'`);
  warnings.push(...artifactWarnings);
  if (runRecord?.status && ["pass", "rework", "fail"].includes(runRecord.status) && !reviewScore?.decision) {
    warnings.push("run-record terminal status has no review decision");
  }

  return {
    run_id: runRecord?.run_id ?? basename(runDir),
    issue: runRecord?.issue ?? null,
    run_record_status: runRecord?.status ?? null,
    state_stage: state?.stage ?? null,
    inferred_artifact_stage: inferredStage,
    decision,
    cleanup_candidate: cleanupCandidate,
    cleanup_reason: cleanupCandidate
      ? "review artifacts and terminal decision exist; run can be removed from active local queue after dashboard/issue/PR record is confirmed"
      : null,
    artifacts,
    warnings
  };
}

const runDirs = existsSync(runsRoot)
  ? readdirSync(runsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("issue-"))
      .map((entry) => join(runsRoot, entry.name))
      .sort()
  : [];

const report = {
  generated_at: new Date().toISOString(),
  runs: runDirs.map(diagnoseRun),
  inbox: parseInbox(),
  dashboard: parseDashboard()
};

console.log(JSON.stringify(report, null, 2));
