#!/usr/bin/env node

import { execFileSync } from "node:child_process";
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

function parsePriorityFromText(text) {
  const match = String(text || "").match(/Priority:\s*(P[0-3])/i);
  return match ? match[1].toUpperCase() : null;
}

function priorityFromLabels(labels, body) {
  const names = labels || [];
  const priorityLabel = names.find((name) => /^priority:p[0-3]$/i.test(name));
  if (priorityLabel) return priorityLabel.split(":")[1].toUpperCase();
  return parsePriorityFromText(body);
}

function readInboxCandidates() {
  const inboxPath = join(repoRoot, ".agents", "inbox.md");
  if (!existsSync(inboxPath)) return [];

  const text = readText(inboxPath);
  const openSection = text.split(/^##\s+/m).find((section) => section.startsWith("Open"));
  if (!openSection) return [];

  return openSection
    .split(/\r?\n(?=-\s+)/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith("-") && entry.includes("candidate-issue"))
    .map((entry) => {
      const id = entry.match(/id:\s*([a-zA-Z0-9-]+)/)?.[1] || null;
      const currentIssue = entry.match(/current issue:\s*([^,\n]+)/i)?.[1]?.trim() || null;
      return {
        id,
        current_issue: currentIssue,
        text: entry.replace(/\s+/g, " ")
      };
    });
}

function readGithubIssueCandidates() {
  const warnings = [];
  try {
    const output = execFileSync("gh", ["api", "repos/tkyoun0421/la-bie-belle/issues?state=open&per_page=100"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
    const issues = JSON.parse(output);
    return {
      warnings,
      issues: issues
        .filter((issue) => !issue.pull_request)
        .map((issue) => {
          const labels = (issue.labels || []).map((label) => label.name);
          return {
            number: issue.number,
            title: issue.title,
            url: issue.html_url,
            labels,
            priority: priorityFromLabels(labels, issue.body),
            blocked: labels.includes("status:blocked"),
            updated_at: issue.updated_at
          };
        })
        .sort((a, b) => {
          const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
          const priorityDiff = (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
          return priorityDiff || a.number - b.number;
        })
    };
  } catch (error) {
    warnings.push(`GitHub issue candidates could not be loaded: ${error.message}`);
    return { warnings, issues: [] };
  }
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
    requirement_fulfillment: "요구사항 충족",
    scope_control: "범위 통제",
    implementation_quality: "구현 품질",
    verification_sufficiency: "검증 충분성",
    risk_and_safety: "리스크와 안전",
    requirement_interpretation: "요구사항 해석",
    plan_appropriateness: "계획 적절성",
    context_usage: "컨텍스트 활용",
    handoff_quality: "인수인계 품질",
    result_quality: "결과 품질",
    process_quality: "프로세스 품질",
    task_spec_quality: "작업 명세 품질",
    context_injection_quality: "컨텍스트 주입 품질",
    role_handoff_quality: "역할 분리와 인수인계 품질",
    verification_gate_quality: "검증 게이트 품질",
    scoring_rubric_quality: "스코어링 루브릭 품질",
    record_and_dashboard_quality: "기록과 대시보드 품질"
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
const activeHarnessScores = [];
const history = safeReadJson(historyPath) || { schema_version: 1, runs: [] };
const dataQualityWarnings = [];

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

  if (harnessScore) {
    harnessScores.push(harnessScore);
    activeHarnessScores.push(harnessScore);
  }

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

  const decision = decisionFromStatus(record.status, reviewScore, state);
  if ((state?.stage || inferredStage) === "reviewed" && ["PASS", "REWORK", "FAIL"].includes(decision)) {
    dataQualityWarnings.push("terminal reviewed run is still active and may need archive/cleanup");
  }

  runs.push({
    issue_number: record.issue.number,
    title: record.issue.title,
    stage: state?.stage || inferredStage,
    decision,
    total_score: reviewScore?.total_score ?? null,
    review_complete: Boolean(reviewScore),
    data_quality_warnings: dataQualityWarnings,
    run_state: "active",
    archived: false,
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
    deductions: (historicalRun.deductions || []).map((deduction) => ({
      ...deduction,
      category: labelForCategory(deduction.category)
    })),
    categories: (historicalRun.categories || []).map((category) => ({
      ...category,
      label: labelForCategory(category.id)
    })),
    archived: true,
    run_state: "archived",
    data_quality_warnings: historicalRun.data_quality_warnings || []
  });

  if (historicalRun.harness_health?.total_score !== null && historicalRun.harness_health?.total_score !== undefined) {
    harnessScores.push(historicalRun.harness_health);
  }
}

runs.sort((a, b) => b.issue_number - a.issue_number);

const scoredRuns = runs.filter((run) => run.review_complete || run.total_score !== null && run.total_score !== undefined);
const issueCount = scoredRuns.length;
const proposals = readImprovementProposals();
const passCount = scoredRuns.filter((run) => run.decision === "PASS").length;
const reworkCount = scoredRuns.filter((run) => run.decision === "REWORK").length;
const failCount = scoredRuns.filter((run) => run.decision === "FAIL").length;
const averageIssueScore = issueCount
  ? Math.round(scoredRuns.reduce((sum, run) => sum + run.total_score, 0) / issueCount)
  : null;
const averageHarnessScore = activeHarnessScores.length
  ? Math.round(activeHarnessScores.reduce((sum, score) => sum + score.total_score, 0) / activeHarnessScores.length)
  : null;

const latestHarnessScore = activeHarnessScores[activeHarnessScores.length - 1];
const activeCount = runs.filter((run) => run.run_state === "active").length;
const archivedCount = runs.filter((run) => run.run_state === "archived").length;
const githubCandidates = readGithubIssueCandidates();
const inboxCandidates = readInboxCandidates();

for (const run of runs) {
  for (const warning of run.data_quality_warnings || []) {
    dataQualityWarnings.push(`#${run.issue_number}: ${warning}`);
  }
}

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
    average_harness_score: averageHarnessScore,
    active_count: activeCount,
    archived_count: archivedCount
  },
  data_quality_warnings: dataQualityWarnings,
  next_work: {
    github_issues: githubCandidates.issues,
    inbox_candidates: inboxCandidates,
    warnings: githubCandidates.warnings
  },
  runs,
  harness_health: harnessHealth,
  agents: [
    {
      name: "Planner",
      file: ".agents/harness/agents/planner.agent.md",
      purpose: "GitHub Issue를 task-spec.md와 plan.md로 변환한다.",
      outputs: ["task-spec.md", "plan.md"],
      handoff: "구체화된 작업 명세와 계획을 구현 단계로 넘긴다."
    },
    {
      name: "Spec",
      file: ".agents/skills/ai-harness-spec/SKILL.md",
      purpose: "구현 전에 미확정 결정을 정리하고 spec.md를 작성한다.",
      outputs: ["spec.md"],
      handoff: "상세 시나리오와 Red 우선순위를 Red 단계로 넘긴다."
    },
    {
      name: "Implementer",
      file: ".agents/harness/agents/implementer.agent.md",
      purpose: "코드 또는 설정 변경을 구현한다.",
      outputs: ["implementation-notes.md"],
      handoff: "변경 파일과 구현 기록을 검증 단계로 넘긴다."
    },
    {
      name: "Verifier",
      file: ".agents/harness/agents/verifier.agent.md",
      purpose: "검증 명령을 실행하고 근거를 기록한다.",
      outputs: ["verification.md"],
      handoff: "검증 근거와 diff 맥락을 리뷰 단계로 넘긴다."
    },
    {
      name: "Reviewer",
      file: ".agents/harness/agents/reviewer.agent.md",
      purpose: "실행 결과를 채점하고 PASS, REWORK, FAIL을 결정한다.",
      outputs: ["review-score.json", "review.md"],
      handoff: "PASS는 PR 단계로, REWORK는 구현 재작업으로, FAIL은 사람 확인으로 넘긴다."
    },
    {
      name: "Harness Evaluator",
      file: ".agents/harness/agents/harness-evaluator.agent.md",
      purpose: "하네스 건강도를 평가하고 개선안을 제안한다.",
      outputs: ["harness-health-score.json", "harness-improvements.md"],
      handoff: "승인된 개선안은 별도 작업으로 구현한다."
    }
  ],
  workflow: [
    { step: "1", name: "Planner", status: "task-spec.md와 plan.md 작성" },
    { step: "2", name: "Spec", status: "spec.md와 Red 우선순위 작성" },
    { step: "3", name: "Red", status: "실패 테스트를 작성하거나 실패 근거 기록" },
    { step: "4", name: "Green", status: "통과에 필요한 최소 변경 구현" },
    { step: "5", name: "Verify", status: "검증 실행 후 verification.md 작성" },
    { step: "6", name: "Review", status: "점수 산정 후 PASS, REWORK, FAIL 결정" },
    { step: "7", name: "Dashboard", status: "run 상태를 dashboard data로 변환" },
    { step: "8", name: "PR", status: "PASS run만 PR로 정리" }
  ]
};

writeFileSync(dashboardDataPath, `window.AI_HARNESS_RUNS = ${JSON.stringify(dashboardData, null, 2)};\n`);
console.log(`Dashboard data written: ${dashboardDataPath}`);
