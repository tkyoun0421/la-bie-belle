import assert from "node:assert/strict";
import { test } from "node:test";
import { readTextFile, resolveRepoRoot } from "../lib/repo.ts";
import { recommendNextAction } from "../dashboard/next-action.ts";
import { summarizeProgress } from "../dashboard/progress.ts";
import type { DashboardView } from "../dashboard/render.ts";
import { DASHBOARD_PATH, SECTION_TITLES, renderDashboard } from "../dashboard/render.ts";
import { summarizeReviews } from "../dashboard/reviews.ts";
import { computeReadiness } from "../dashboard/rubric.ts";
import { makePhase, makeTask } from "./fixture.ts";

const GENERATED_AT = "2026-08-03T10:30:00.000Z";
const BASE_COMMIT = "ac68f255b2e4e2e36bc3d13e504edfb73b9d2c0e";

const RECORDS = [
  makePhase({ id: "P0", title: "기반" }),
  makeTask({ id: "P0-T30", status: "done", test_mode: "docs_only" }),
  makeTask({ id: "P0-T31", status: "done", test_mode: "tdd" }),
  makeTask({ id: "P0-T29", status: "in_progress", title: "운영 의사결정 대시보드" }),
];

function viewOf(overrides: Partial<DashboardView> = {}): DashboardView {
  const progress = summarizeProgress(RECORDS);
  return {
    generatedAt: GENERATED_AT,
    baseCommit: BASE_COMMIT,
    baseCommitSubject: "docs(P0-T32): define cross-review contract",
    workingTreeNote: "커밋되지 않은 변경 없음",
    readiness: computeReadiness({
      gates: [{ id: "gate:index", passed: true, violations: 0 }],
      referenceGates: [{ id: "gate:scope", passed: true, violations: 0 }],
      evidence: [{ taskId: "P0-T31", requirement: "tdd", present: true }],
      runnablePlannedCount: 0,
      blockedCount: 0,
      freshness: { kind: "fresh", recordedCommit: BASE_COMMIT },
      pendingAdrCount: 0,
      openDebtCount: 2,
    }),
    progress,
    nextAction: recommendNextAction(progress),
    reviews: summarizeReviews([], null),
    notices: [],
    ...overrides,
  };
}

test("render — 섹션 4종을 모두 표시한다", () => {
  const html = renderDashboard(viewOf());

  for (const title of Object.values(SECTION_TITLES)) {
    assert.ok(html.includes(title), `섹션 "${title}"이 없다`);
  }
});

test("render — 기준 시각과 기준 커밋을 상단에 표시한다", () => {
  const html = renderDashboard(viewOf());

  assert.ok(html.includes(GENERATED_AT), "기준 시각이 없다");
  assert.ok(html.includes(BASE_COMMIT), "기준 커밋이 없다");
});

test("render — 기준 커밋을 읽지 못하면 누락으로 표시하고 값을 만들지 않는다", () => {
  const html = renderDashboard(viewOf({ baseCommit: null, baseCommitSubject: null }));

  assert.match(html, /기준 커밋[\s\S]{0,120}누락/u);
});

test("render — 다음 생성이 읽을 기준 커밋 marker를 심는다", () => {
  const html = renderDashboard(viewOf());
  assert.ok(
    html.includes(`<meta name="base-commit" content="${BASE_COMMIT}">`),
    "기준 커밋 marker가 없다",
  );

  const missing = renderDashboard(viewOf({ baseCommit: null, baseCommitSubject: null }));
  assert.doesNotMatch(missing, /base-commit/u, "커밋을 모르면 marker를 만들지 않아야 한다");
});

test("render — 모바일 뷰포트 meta를 포함한 단일 HTML 문서다", () => {
  const html = renderDashboard(viewOf());

  assert.match(html, /^<!doctype html>/iu);
  assert.match(html, /<meta\s+name="viewport"\s+content="width=device-width,\s*initial-scale=1"/u);
  assert.match(html, /<html\s+lang="ko">/u);
  assert.ok(html.includes("</html>"), "문서가 닫히지 않았다");
});

test("render — 외부 리소스를 하나도 참조하지 않는다", () => {
  const html = renderDashboard(viewOf());

  for (const pattern of [/https?:\/\//u, /<link\b/u, /\bsrc\s*=/u, /@import/u, /url\(/u]) {
    assert.doesNotMatch(html, pattern, `외부 리소스 참조가 있다: ${String(pattern)}`);
  }
  assert.ok(html.includes("<style>"), "인라인 스타일이 없다");
});

test("render — 원본 문자열을 HTML로 이스케이프한다", () => {
  const html = renderDashboard(
    viewOf({
      notices: ['<script>alert("x")</script> & "따옴표"'],
    }),
  );

  assert.ok(!html.includes("<script>alert"), "이스케이프되지 않은 스크립트가 있다");
  assert.ok(html.includes("&lt;script&gt;"), "이스케이프된 문자열이 없다");
  assert.ok(html.includes("&amp;"), "앰퍼샌드가 이스케이프되지 않았다");
});

test("render — 준비도 점수와 근거 수치를 함께 표시한다", () => {
  const view = viewOf();
  const html = renderDashboard(view);

  assert.ok(html.includes(`${view.readiness.total}`), "총점이 없다");
  assert.ok(html.includes(view.readiness.grade), "등급이 없다");
  for (const section of view.readiness.sections) {
    assert.ok(html.includes(section.label), `영역 ${section.label}이 없다`);
    for (const item of section.items) {
      assert.ok(html.includes(item.evidence), `근거 "${item.evidence}"가 없다`);
    }
  }
});

test("render — 진행도와 현재 in_progress task를 표시한다", () => {
  const html = renderDashboard(viewOf());

  assert.ok(html.includes("P0-T29"), "in_progress task가 없다");
  assert.ok(html.includes("운영 의사결정 대시보드"), "task 제목이 없다");
  assert.match(html, /67\s*%/u);
});

test("render — 검증 결과가 없으면 결과 없음을 표시한다", () => {
  const html = renderDashboard(viewOf());

  assert.ok(html.includes("결과 없음"), "결과 없음 표시가 없다");
});

test("render — 검증 결과 형식 오류를 안전하게 표시한다", () => {
  const html = renderDashboard(
    viewOf({
      reviews: summarizeReviews(
        [{ file: "docs/execution/reviews/P0-T29-review.json", text: "{ broken" }],
        null,
      ),
    }),
  );

  assert.ok(html.includes("형식 오류"), "형식 오류 표시가 없다");
  assert.ok(html.includes("P0-T29-review.json"), "문제 파일 경로가 없다");
});

test("render — 다음 행동과 차단 사유를 표시한다", () => {
  const view = viewOf();
  const html = renderDashboard(view);

  assert.ok(html.includes(view.nextAction.headline), "다음 행동이 없다");
  assert.ok(html.includes(view.nextAction.rationale), "추천 근거가 없다");
});

test("render — 생성된 산출물이 같은 계약을 만족한다", () => {
  const html = readTextFile(resolveRepoRoot(), DASHBOARD_PATH);
  assert.ok(html !== null, `${DASHBOARD_PATH} 산출물이 있어야 한다. pnpm dashboard로 생성한다`);

  for (const title of Object.values(SECTION_TITLES)) {
    assert.ok(html.includes(title), `산출물에 섹션 "${title}"이 없다`);
  }
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/u);
  assert.match(html, /<meta name="base-commit" content="[0-9a-f]{40}">/u);
  assert.match(
    html,
    /<dt>기준 시각<\/dt><dd class="mono">[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+Z<\/dd>/u,
  );
  assert.match(
    html,
    /<dt>기준 커밋<\/dt><dd>(<span class="mono">[0-9a-f]{40}<\/span>|<span class="missing">누락)/u,
  );
  for (const pattern of [/https?:\/\//u, /<link\b/u, /\bsrc\s*=/u, /@import/u, /url\(/u]) {
    assert.doesNotMatch(html, pattern, `산출물에 외부 리소스 참조가 있다: ${String(pattern)}`);
  }
});

test("render — 상세 의존성은 접힌 상태로 제공한다", () => {
  const html = renderDashboard(viewOf());

  assert.match(html, /<details>/u);
  assert.match(html, /<summary>/u);
});
