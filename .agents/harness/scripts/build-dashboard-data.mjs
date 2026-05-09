#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../..");
const runsRoot = join(repoRoot, ".agents", "runs");
const dashboardDataPath = join(repoRoot, ".agents", "harness", "dashboard", "data", "runs.js");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function safeReadScore(runDir, artifactPath) {
  if (!artifactPath) return null;
  const path = join(runDir, artifactPath);
  return existsSync(path) ? readJson(path) : null;
}

function labelForCategory(id) {
  const labels = {
    requirement_fulfillment: "요구사항 충족도",
    scope_control: "범위 준수",
    implementation_quality: "구현 품질",
    verification_sufficiency: "검증 충분성",
    risk_and_safety: "리스크와 안전성",
    requirement_interpretation: "요구사항 해석 품질",
    plan_appropriateness: "계획 적절성",
    context_usage: "컨텍스트 활용",
    handoff_quality: "기록과 인수인계 품질"
  };
  return labels[id] || id;
}

function decisionFromStatus(status, score) {
  if (score?.decision) return score.decision;
  if (status === "pass" || status === "draft_pr_created") return "PASS";
  if (status === "rework") return "REWORK";
  if (status === "fail") return "FAIL";
  return "FAIL";
}

const runDirs = existsSync(runsRoot)
  ? readdirSync(runsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("issue-"))
    .map((entry) => join(runsRoot, entry.name))
  : [];

const runs = [];
const harnessScores = [];

for (const runDir of runDirs) {
  const runRecordPath = join(runDir, "run-record.json");
  if (!existsSync(runRecordPath)) continue;

  const record = readJson(runRecordPath);
  const reviewScore = safeReadScore(runDir, record.artifacts?.review_score);
  const harnessScore = safeReadScore(runDir, record.artifacts?.harness_health_score);

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

  runs.push({
    issue_number: record.issue.number,
    title: record.issue.title,
    decision: decisionFromStatus(record.status, reviewScore),
    total_score: reviewScore?.total_score ?? 0,
    harness_score: harnessScore?.total_score ?? 0,
    attempt: record.attempt || 1,
    updated_at: record.updated_at || record.created_at,
    strengths: reviewScore?.strengths || [],
    weaknesses: reviewScore?.weaknesses || [],
    deductions,
    categories
  });
}

runs.sort((a, b) => b.issue_number - a.issue_number);

const issueCount = runs.length;
const passCount = runs.filter((run) => run.decision === "PASS").length;
const reworkCount = runs.filter((run) => run.decision === "REWORK").length;
const failCount = runs.filter((run) => run.decision === "FAIL").length;
const averageIssueScore = issueCount
  ? Math.round(runs.reduce((sum, run) => sum + run.total_score, 0) / issueCount)
  : 0;
const averageHarnessScore = harnessScores.length
  ? Math.round(harnessScores.reduce((sum, score) => sum + score.total_score, 0) / harnessScores.length)
  : 0;

const latestHarnessScore = harnessScores[harnessScores.length - 1];
const harnessHealth = latestHarnessScore ? {
  total_score: latestHarnessScore.total_score,
  categories: latestHarnessScore.categories.map((category) => ({
    label: labelForCategory(category.id),
    score: category.score,
    max: category.max_score
  })),
  proposals: []
} : {
  total_score: averageHarnessScore,
  categories: [],
  proposals: []
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
      purpose: "GitHub Issue를 실행 가능한 작업 명세와 계획으로 변환",
      outputs: ["task-spec.md", "plan.md"],
      handoff: "필수 필드와 계획이 준비되면 Implementer로 전달"
    },
    {
      name: "Spec",
      file: ".agents/skills/ai-harness-spec/SKILL.md",
      purpose: "생성된 이슈를 상세 스펙과 테스트 케이스로 구체화",
      outputs: ["spec.md"],
      handoff: "상세 스펙과 Red 우선순위가 준비되면 Red 단계로 전달"
    },
    {
      name: "Implementer",
      file: ".agents/harness/agents/implementer.agent.md",
      purpose: "작업 명세와 계획에 맞춰 코드 또는 설정 변경 구현",
      outputs: ["implementation-notes.md"],
      handoff: "변경과 구현 기록이 준비되면 Verifier로 전달"
    },
    {
      name: "Refactor",
      file: ".agents/skills/ai-harness-refactor/SKILL.md",
      purpose: "Green 이후 동작 변경 없이 구조 개선",
      outputs: ["implementation-notes.md"],
      handoff: "리팩토링 수행 또는 생략 사유가 기록되면 Verifier로 전달"
    },
    {
      name: "Verifier",
      file: ".agents/harness/agents/verifier.agent.md",
      purpose: "완료 기준에 맞춰 테스트, 린트, 빌드, 수동 확인 근거 기록",
      outputs: ["verification.md"],
      handoff: "검증 결과와 diff 입력이 준비되면 Reviewer로 전달"
    },
    {
      name: "Reviewer",
      file: ".agents/harness/agents/reviewer.agent.md",
      purpose: "100점 루브릭으로 자동 채점하고 PR 전 게이트 결정",
      outputs: ["review-score.json", "review.md"],
      handoff: "PASS는 PR 생성, REWORK는 Implementer, FAIL은 사람 확인으로 전달"
    },
    {
      name: "PR",
      file: ".agents/harness/agents/draft-pr.agent.md",
      purpose: "PASS된 작업을 바로 리뷰/머지 가능한 일반 PR로 정리",
      outputs: ["draft-pr.md"],
      handoff: "머지와 배포는 사람 승인 대기"
    },
    {
      name: "Harness Evaluator",
      file: ".agents/harness/agents/harness-evaluator.agent.md",
      purpose: "하네스 건강도를 평가하고 개선안을 제안",
      outputs: ["harness-health-score.json", "harness-improvements.md"],
      handoff: "개선안은 사람 승인 후 별도 일반 PR로 구현"
    }
  ],
  workflow: [
    { step: "1", name: "Planner", status: "task-spec.md / plan.md 생성" },
    { step: "2", name: "Spec", status: "spec.md 생성 / 테스트 케이스와 Red 우선순위 정리" },
    { step: "3", name: "Red", status: "실패 테스트 작성 / 실패 확인" },
    { step: "4", name: "Green", status: "최소 구현 / Red 테스트 통과" },
    { step: "5", name: "Refactor", status: "조건부 구조 개선 / 동작 변경 금지" },
    { step: "6", name: "Verifier", status: "검증 실행 / verification.md 생성" },
    { step: "7", name: "Reviewer", status: "자동 채점 / PASS, REWORK, FAIL 결정" },
    { step: "8", name: "Rework Loop", status: "REWORK면 재작업 후 재채점" },
    { step: "9", name: "PR", status: "PASS일 때만 일반 PR 생성" },
    { step: "10", name: "Harness Evaluator", status: "하네스 건강도 평가 / 개선안 제안" }
  ]
};

writeFileSync(dashboardDataPath, `window.AI_HARNESS_RUNS = ${JSON.stringify(dashboardData, null, 2)};\n`);
console.log(`대시보드 데이터 생성 완료: ${dashboardDataPath}`);
