import assert from "node:assert/strict";
import { test } from "node:test";
import { readTextFile, resolveRepoRoot } from "../lib/repo.ts";
import type { ReviewDocument } from "../dashboard/reviews.ts";
import {
  BACKLOG_PATH,
  REVIEWS_DIRECTORY,
  isReviewFileName,
  parseBacklog,
  parseReviewDocument,
  summarizeReviews,
} from "../dashboard/reviews.ts";

const EXAMPLE_PATH = "docs/execution/reviews/example-review.json";

function exampleText(): string {
  const text = readTextFile(resolveRepoRoot(), EXAMPLE_PATH);
  assert.ok(text !== null, `${EXAMPLE_PATH} fixture를 읽을 수 있어야 한다`);
  return text;
}

function documentOf(taskId: string, value: unknown): ReviewDocument {
  return { file: `${REVIEWS_DIRECTORY}/${taskId}-review.json`, text: JSON.stringify(value) };
}

function exampleObject(): Record<string, unknown> {
  return JSON.parse(exampleText()) as Record<string, unknown>;
}

test("reviews — 계약 예시 파일을 정상 파싱한다", () => {
  const parsed = parseReviewDocument(exampleText());

  assert.ok(parsed.ok, `예시 파일 파싱 실패: ${parsed.ok ? "" : parsed.errors.join(", ")}`);
  if (!parsed.ok) {
    return;
  }
  assert.equal(parsed.result.taskId, "P0-T99");
  assert.equal(parsed.result.total, 84);
  assert.deepEqual(Object.keys(parsed.result.scores).sort(), [
    "architecture",
    "code_quality",
    "performance",
    "security",
    "tests",
  ]);
  assert.equal(parsed.result.scores["security"], 90);
  assert.equal(parsed.result.findings.length, 4);
  assert.deepEqual(
    parsed.result.findings.map((finding) => finding.severity),
    ["critical", "high", "medium", "low"],
  );
  assert.equal(parsed.result.participants.length, 3);
});

test("reviews — 결과 파일 이름 규칙만 실제 결과로 인정한다", () => {
  assert.equal(isReviewFileName("P0-T29-review.json"), true);
  assert.equal(isReviewFileName("P12-T07-review.json"), true);
  assert.equal(isReviewFileName("example-review.json"), false);
  assert.equal(isReviewFileName("P0-T9-review.json"), false);
  assert.equal(isReviewFileName("P0-T29-review.md"), false);
  assert.equal(isReviewFileName("backlog.md"), false);
});

test("reviews — 깨진 JSON은 형식 오류로 보고한다", () => {
  const parsed = parseReviewDocument("{ task_id: ");

  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    assert.match(parsed.errors.join("\n"), /JSON/u);
  }
});

test("reviews — 필수 필드가 없으면 형식 오류로 보고한다", () => {
  const parsed = parseReviewDocument(JSON.stringify({ task_id: "P0-T29" }));

  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    assert.ok(parsed.errors.length > 0, "누락 필드가 보고되어야 한다");
    assert.match(parsed.errors.join("\n"), /scores/u);
  }
});

test("reviews — 점수 범위와 5개 영역 키를 검사한다", () => {
  const outOfRange = exampleObject();
  outOfRange["scores"] = { ...(outOfRange["scores"] as object), security: 101 };
  assert.equal(parseReviewDocument(JSON.stringify(outOfRange)).ok, false);

  const missingArea = exampleObject();
  missingArea["scores"] = { code_quality: 80, tests: 80, security: 80, performance: 80 };
  assert.equal(parseReviewDocument(JSON.stringify(missingArea)).ok, false);

  const fractional = exampleObject();
  fractional["scores"] = { ...(fractional["scores"] as object), tests: 80.5 };
  assert.equal(parseReviewDocument(JSON.stringify(fractional)).ok, false);
});

test("reviews — 확정 기준 미달 발견과 참여자 1명은 형식 오류다", () => {
  const singleAgreement = exampleObject();
  singleAgreement["findings"] = [
    {
      id: "F-01",
      severity: "high",
      area: "tests",
      title: "혼자 주장한 발견",
      description: "확정되지 않은 발견은 결과 파일에 남지 않는다.",
      file: "src/x.ts",
      agreed_by: ["main"],
    },
  ];
  assert.equal(parseReviewDocument(JSON.stringify(singleAgreement)).ok, false);

  const soloParticipant = exampleObject();
  soloParticipant["participants"] = ["main"];
  assert.equal(parseReviewDocument(JSON.stringify(soloParticipant)).ok, false);
});

test("reviews — 알 수 없는 중요도와 영역은 형식 오류다", () => {
  const badSeverity = exampleObject();
  const findings = badSeverity["findings"] as Record<string, unknown>[];
  badSeverity["findings"] = [{ ...findings[0], severity: "blocker" }];
  assert.equal(parseReviewDocument(JSON.stringify(badSeverity)).ok, false);

  const badArea = exampleObject();
  badArea["findings"] = [{ ...findings[0], area: "ux" }];
  assert.equal(parseReviewDocument(JSON.stringify(badArea)).ok, false);
});

test("reviews — 결과가 하나도 없으면 결과 없음을 표시한다", () => {
  const summary = summarizeReviews([], null);

  assert.equal(summary.status, "none");
  assert.equal(summary.latest, null);
  assert.deepEqual(summary.invalid, []);
  assert.equal(summary.backlog.open.length, 0);
});

test("reviews — 형식 오류 파일은 생성을 막지 않고 오류로 표시된다", () => {
  const summary = summarizeReviews(
    [{ file: `${REVIEWS_DIRECTORY}/P0-T29-review.json`, text: "{ broken" }],
    null,
  );

  assert.equal(summary.status, "none");
  assert.equal(summary.invalid.length, 1);
  assert.equal(summary.invalid[0]?.file, `${REVIEWS_DIRECTORY}/P0-T29-review.json`);
});

test("reviews — 최신 결과는 확정 시각이 가장 늦은 것이다", () => {
  const older = exampleObject();
  older["task_id"] = "P0-T30";
  older["at"] = "2026-08-01T00:00:00Z";
  const newer = exampleObject();
  newer["task_id"] = "P0-T31";
  newer["at"] = "2026-08-02T00:00:00Z";

  const summary = summarizeReviews([documentOf("P0-T31", newer), documentOf("P0-T30", older)], null);

  assert.equal(summary.status, "ok");
  assert.equal(summary.latest?.taskId, "P0-T31");
  assert.equal(summary.results.length, 2);
});

test("reviews — 최신 결과의 확정 발견을 중요도 순서로 묶는다", () => {
  const summary = summarizeReviews([documentOf("P0-T99", exampleObject())], null);
  const groups = summary.findingsBySeverity;

  assert.deepEqual(
    groups.map((group) => group.severity),
    ["critical", "high", "medium", "low"],
  );
  assert.deepEqual(
    groups.map((group) => group.findings.length),
    [1, 1, 1, 1],
  );
});

test("reviews — backlog는 미완료와 완료 항목을 구분한다", () => {
  const backlog = parseBacklog(
    [
      "# 교차 검증 backlog",
      "",
      "```text",
      "- [ ] [severity] [task-id] 제목 — 근거 파일",
      "```",
      "",
      "## 목록",
      "",
      "- [ ] [medium] [P0-T29] 근거 수치 문구가 중복된다 — harness/dashboard/rubric.ts",
      "- [x] [low] [P0-T31] 명명이 일관되지 않는다 — harness/lib/glob.ts",
      "- 형식을 벗어난 줄",
      "",
    ].join("\n"),
  );

  assert.equal(backlog.open.length, 1);
  assert.equal(backlog.open[0]?.severity, "medium");
  assert.equal(backlog.open[0]?.taskId, "P0-T29");
  assert.equal(backlog.open[0]?.file, "harness/dashboard/rubric.ts");
  assert.equal(backlog.resolved.length, 1);
  assert.equal(backlog.resolved[0]?.severity, "low");
});

test("reviews — 저장소의 실제 backlog는 코드블록 예시를 항목으로 세지 않는다", () => {
  const markdown = readTextFile(resolveRepoRoot(), BACKLOG_PATH);
  assert.ok(markdown !== null, `${BACKLOG_PATH}를 읽을 수 있어야 한다`);

  const backlog = parseBacklog(markdown);

  assert.equal(backlog.open.length, 0);
  assert.equal(backlog.resolved.length, 0);
});

test("reviews — backlog 파일이 없으면 빈 목록으로 처리한다", () => {
  const backlog = parseBacklog(null);

  assert.deepEqual(backlog.open, []);
  assert.deepEqual(backlog.resolved, []);
  assert.deepEqual(backlog.malformed, []);
});
