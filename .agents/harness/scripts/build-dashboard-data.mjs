#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../..");
const runsRoot = join(repoRoot, ".agents", "runs");
const dashboardDataPath = join(repoRoot, ".agents", "harness", "dashboard", "data", "runs.js");
const proposalsRoot = join(repoRoot, ".agents", "harness", "improvements", "proposals");
const historyPath = join(repoRoot, ".agents", "harness", "history", "runs.json");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function safeReadJson(path) {
  return existsSync(path) ? readJson(path) : null;
}

function safeReadScore(runDir, artifactPath) {
  if (!artifactPath) return null;
  return safeReadJson(join(runDir, artifactPath));
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function isMarkdownTemplate(path) {
  if (!existsSync(path)) return true;
  const text = readText(path).trim();
  const placeholderLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line === "작성 필요." || line === "- 작성 필요.");
  return !text || placeholderLines.length > 0;
}

function isReviewScoreTemplate(score) {
  if (!score) return true;

  const hasEvidence = (score.categories || []).some(
    (category) => (category.evidence || []).length > 0 || (category.deductions || []).length > 0
  );

  return (
    score.score_id === "issue-000-review-attempt-1" ||
    score.scored_at === "1970-01-01T00:00:00.000Z" ||
    String(score.recommended_next_action || "").includes("작성 필요") ||
    (score.decision === "FAIL" && score.total_score === 0 && !hasEvidence)
  );
}

function completeReviewScore(runDir, artifactPath) {
  const score = safeReadScore(runDir, artifactPath);
  return isReviewScoreTemplate(score) ? null : score;
}

function artifactComplete(runDir, artifactPath) {
  if (!artifactPath) return false;
  return !isMarkdownTemplate(join(runDir, artifactPath));
}

function readImprovementProposals() {
  if (!existsSync(proposalsRoot)) return [];

  return readdirSync(proposalsRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => {
      const proposal = readJson(join(proposalsRoot, entry.name));
      return {
        proposal_id: proposal.proposal_id,
        target_area: proposal.target_area,
        title: proposal.proposal_id,
        reason: proposal.problem || "",
        expected_impact: proposal.expected_impact || "",
        status: proposal.status || "proposed",
        file: `.agents/harness/improvements/proposals/${entry.name}`
      };
    })
    .sort((a, b) => a.proposal_id.localeCompare(b.proposal_id));
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

function decisionFromStatus(status, score, state) {
  if (state?.decision) return state.decision;
  if (score?.decision) return score.decision;
  if (status === "pass" || status === "draft_pr_created") return "PASS";
  if (status === "rework") return "REWORK";
  if (status === "fail") return "FAIL";
  return null;
}

function stageFromArtifacts(runDir, record, reviewScore) {
  if (reviewScore && artifactComplete(runDir, record.artifacts?.review)) return "reviewed";
  if (artifactComplete(runDir, record.artifacts?.verification)) return "verified";
  if (artifactComplete(runDir, record.artifacts?.implementation_notes)) return "green";
  if (artifactComplete(runDir, record.artifacts?.spec)) return "specified";
  if (artifactComplete(runDir, record.artifacts?.task_spec) && artifactComplete(runDir, record.artifacts?.plan)) return "planned";
  return "unplanned";
}

const runDirs = existsSync(runsRoot)
  ? readdirSync(runsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("issue-"))
      .map((entry) => join(runsRoot, entry.name))
  : [];

const runs = [];
const harnessScores = [];
const history = safeReadJson(historyPath) || { schema_version: 1, runs: [] };

for (const runDir of runDirs) {
  const runRecordPath = join(runDir, "run-record.json");
  if (!existsSync(runRecordPath)) continue;

  const record = readJson(runRecordPath);
  const state = safeReadJson(join(runDir, "state.json"));
  const reviewScore = completeReviewScore(runDir, record.artifacts?.review_score);
  const harnessScore = safeReadScore(
    runDir,
    record.artifacts?.harness_health_score || "harness-health-score.json"
  );

  if (harnessScore) harnessScores.push(harnessScore);

  const categories = (reviewScore?.categories || []).map((category) => ({
    id: category.id,
    label: labelForCategory(category.id),
    score: category.score,
    max: category.max_score
  }));

  const deductions = (reviewScore?.categories || []).flatMap((category) =>
    (category.deductions || []).map((reason) => ({
      category: labelForCategory(category.id),
      points: Math.max(0, category.max_score - category.score),
      reason
    }))
  );

  const inferredStage = stageFromArtifacts(runDir, record, reviewScore);
  if (inferredStage === "unplanned") continue;

  const dataQualityWarnings = [];
  if (!reviewScore) dataQualityWarnings.push("review score is missing or still an unfilled template");
  if (record.artifacts?.review && isMarkdownTemplate(join(runDir, record.artifacts.review))) {
    dataQualityWarnings.push("review artifact is missing or still an unfilled template");
  }

  runs.push({
    issue_number: record.issue.number,
    title: record.issue.title,
    stage: state?.stage || inferredStage,
    decision: decisionFromStatus(record.status, reviewScore, state),
    total_score: reviewScore?.total_score ?? null,
    review_complete: Boolean(reviewScore),
    data_quality_warnings: dataQualityWarnings,
    harness_score: harnessScore?.total_score ?? null,
    priority: state?.priority ?? null,
    blocked: state?.blocked ?? false,
    blockers: state?.blockers ?? [],
    inbox_refs: state?.inbox_refs ?? [],
    dashboard_synced_at: state?.dashboard_synced_at ?? null,
    attempt: record.attempt || 1,
    updated_at: state?.updated_at || record.updated_at || record.created_at,
    strengths: reviewScore?.strengths || [],
    weaknesses: reviewScore?.weaknesses || [],
    deductions,
    categories
  });
}

const activeRunIds = new Set(runs.map((run) => `issue-${run.issue_number}`));
for (const historicalRun of history.runs || []) {
  if (activeRunIds.has(historicalRun.run_id)) continue;

  runs.push({
    ...historicalRun,
    archived: true
  });

  if (historicalRun.harness_health?.total_score !== null && historicalRun.harness_health?.total_score !== undefined) {
    harnessScores.push(historicalRun.harness_health);
  }
}

runs.sort((a, b) => b.issue_number - a.issue_number);

const scoredRuns = runs.filter((run) => run.review_complete);
const issueCount = scoredRuns.length;
const proposals = readImprovementProposals();
const passCount = scoredRuns.filter((run) => run.decision === "PASS").length;
const reworkCount = scoredRuns.filter((run) => run.decision === "REWORK").length;
const failCount = scoredRuns.filter((run) => run.decision === "FAIL").length;
const averageIssueScore = issueCount
  ? Math.round(scoredRuns.reduce((sum, run) => sum + run.total_score, 0) / issueCount)
  : null;
const averageHarnessScore = harnessScores.length
  ? Math.round(harnessScores.reduce((sum, score) => sum + score.total_score, 0) / harnessScores.length)
  : null;

const latestHarnessScore = harnessScores[harnessScores.length - 1];
const harnessHealth = latestHarnessScore ? {
  total_score: latestHarnessScore.total_score,
  categories: (latestHarnessScore.categories || []).map((category) => ({
    label: labelForCategory(category.id),
    score: category.score,
    max: category.max_score,
    evidence: category.evidence || [],
    deductions: category.deductions || []
  })),
  proposals
} : {
  total_score: null,
  missing: true,
  categories: [],
  proposals
};

const dashboardData = {
  generated_at: new Date().toISOString(),
  summary: {
    issue_count: issueCount,
    average_issue_score: averageIssueScore,
    pass_count: passCount,
    rework_count: reworkCount,
    fail_count: failCount,
    average_harness_score: averageHarnessScore
  },
  runs,
  harness_health: harnessHealth,
  agents: [
    {
      name: "Planner",
      file: ".agents/harness/agents/planner.agent.md",
      purpose: "Convert a GitHub Issue into task-spec.md and plan.md.",
      outputs: ["task-spec.md", "plan.md"],
      handoff: "Pass a concrete task spec and plan to implementation."
    },
    {
      name: "Spec",
      file: ".agents/skills/ai-harness-spec/SKILL.md",
      purpose: "Clarify decisions and write spec.md before implementation.",
      outputs: ["spec.md"],
      handoff: "Pass detailed scenarios and Red priorities to Red."
    },
    {
      name: "Implementer",
      file: ".agents/harness/agents/implementer.agent.md",
      purpose: "Implement code or configuration changes.",
      outputs: ["implementation-notes.md"],
      handoff: "Pass changed files and notes to verification."
    },
    {
      name: "Verifier",
      file: ".agents/harness/agents/verifier.agent.md",
      purpose: "Run verification commands and record evidence.",
      outputs: ["verification.md"],
      handoff: "Pass verification evidence and diff context to review."
    },
    {
      name: "Reviewer",
      file: ".agents/harness/agents/reviewer.agent.md",
      purpose: "Score the run and decide PASS, REWORK, or FAIL.",
      outputs: ["review-score.json", "review.md"],
      handoff: "PASS goes to PR, REWORK returns to implementation, FAIL waits for human review."
    },
    {
      name: "Harness Evaluator",
      file: ".agents/harness/agents/harness-evaluator.agent.md",
      purpose: "Evaluate harness health and propose improvements.",
      outputs: ["harness-health-score.json", "harness-improvements.md"],
      handoff: "Approved improvements are implemented separately."
    }
  ],
  workflow: [
    { step: "1", name: "Planner", status: "Create task-spec.md and plan.md" },
    { step: "2", name: "Spec", status: "Create spec.md and Red priorities" },
    { step: "3", name: "Red", status: "Write or record failing tests" },
    { step: "4", name: "Green", status: "Implement the minimum passing change" },
    { step: "5", name: "Verify", status: "Run verification and write verification.md" },
    { step: "6", name: "Review", status: "Score and decide PASS, REWORK, or FAIL" },
    { step: "7", name: "Dashboard", status: "Project run state into dashboard data" },
    { step: "8", name: "PR", status: "Draft a PR only for PASS runs" }
  ]
};

writeFileSync(dashboardDataPath, `window.AI_HARNESS_RUNS = ${JSON.stringify(dashboardData, null, 2)};\n`);
console.log(`Dashboard data written: ${dashboardDataPath}`);
