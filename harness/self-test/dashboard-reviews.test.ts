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

function scanObject(): Record<string, unknown> {
  const scan = exampleObject();
  delete scan["task_id"];
  scan["scope"] = "full-scan";
  return scan;
}

function scanDocument(date: string, value: unknown): ReviewDocument {
  return { file: `${REVIEWS_DIRECTORY}/scan-${date}-review.json`, text: JSON.stringify(value) };
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
  assert.deepEqual(parsed.result.participants, ["opus", "codex"]);
});

test("reviews — 저장소의 실제 결과 파일은 개정 규칙을 통과한다", () => {
  const path = "docs/execution/reviews/P0-T29-review.json";
  const text = readTextFile(resolveRepoRoot(), path);
  assert.ok(text !== null, `${path}를 읽을 수 있어야 한다`);

  const parsed = parseReviewDocument(text);

  assert.ok(parsed.ok, `기존 결과 파일 파싱 실패: ${parsed.ok ? "" : parsed.errors.join(", ")}`);
  if (parsed.ok) {
    assert.equal(parsed.result.taskId, "P0-T29");
    assert.equal(parsed.result.total, 91);
  }
});

test("reviews — total이 5영역 평균의 반올림 정수가 아니면 형식 오류다", () => {
  const wrongTotal = exampleObject();
  wrongTotal["total"] = 85;
  const parsed = parseReviewDocument(JSON.stringify(wrongTotal));

  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    assert.match(parsed.errors.join("\n"), /total/u);
  }
});

test("reviews — total이 5영역 평균의 반올림 정수면 통과한다", () => {
  const rounded = exampleObject();
  rounded["scores"] = {
    code_quality: 90,
    tests: 89,
    security: 90,
    performance: 90,
    architecture: 90,
  };
  rounded["total"] = 90;

  assert.equal(parseReviewDocument(JSON.stringify(rounded)).ok, true);
});

test("reviews — 대체 리뷰어 opus-2를 인정한다", () => {
  const replaced = exampleObject();
  replaced["participants"] = ["opus", "opus-2"];
  replaced["participants_note"] = "Codex CLI를 쓸 수 없어 독립 Opus 서브 에이전트 2자로 진행했다.";
  const findings = replaced["findings"] as Record<string, unknown>[];
  replaced["findings"] = findings.map((finding) => ({ ...finding, agreed_by: ["opus", "opus-2"] }));

  const parsed = parseReviewDocument(JSON.stringify(replaced));

  assert.ok(parsed.ok, `opus-2 참여 파싱 실패: ${parsed.ok ? "" : parsed.errors.join(", ")}`);
});

test("reviews — agreed_by는 participants의 부분집합이어야 한다", () => {
  const outsider = exampleObject();
  const findings = outsider["findings"] as Record<string, unknown>[];
  outsider["findings"] = [{ ...findings[0], agreed_by: ["opus", "opus-2"] }];

  const parsed = parseReviewDocument(JSON.stringify(outsider));

  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    assert.match(parsed.errors.join("\n"), /participants/u);
  }
});

test("reviews — 수동 전체 스캔 결과 파일 이름도 실제 결과로 인정한다", () => {
  assert.equal(isReviewFileName("scan-2026-08-04-review.json"), true);
  assert.equal(isReviewFileName("scan-2026-8-4-review.json"), false);
  assert.equal(isReviewFileName("scan-review.json"), false);
  assert.equal(isReviewFileName("scan-2026-08-04-review.md"), false);
});

test("reviews — 수동 전체 스캔 결과는 전체 스캔 <날짜>로 표시한다", () => {
  const summary = summarizeReviews([scanDocument("2026-08-04", scanObject())], null);

  assert.equal(summary.status, "ok");
  assert.deepEqual(summary.invalid, []);
  assert.equal(summary.latest?.taskId, "전체 스캔 2026-08-04");
});

test("reviews — 스캔 결과의 task_id와 잘못된 scope는 형식 오류다", () => {
  const withTaskId = scanObject();
  withTaskId["task_id"] = "P0-T99";
  const taskIdSummary = summarizeReviews([scanDocument("2026-08-04", withTaskId)], null);
  assert.equal(taskIdSummary.invalid.length, 1);

  const withoutScope = scanObject();
  delete withoutScope["scope"];
  assert.equal(
    summarizeReviews([scanDocument("2026-08-04", withoutScope)], null).invalid.length,
    1,
  );

  const wrongScope = scanObject();
  wrongScope["scope"] = "partial";
  assert.equal(summarizeReviews([scanDocument("2026-08-04", wrongScope)], null).invalid.length, 1);
});

test("reviews — task 결과의 task_id는 파일 이름의 task ID와 같아야 한다", () => {
  const mismatched = exampleObject();
  mismatched["task_id"] = "P0-T99";
  const summary = summarizeReviews(
    [{ file: `${REVIEWS_DIRECTORY}/P0-T33-review.json`, text: JSON.stringify(mismatched) }],
    null,
  );

  assert.equal(summary.status, "none", "파일 이름과 다른 task_id는 결과로 인정하지 않는다");
  assert.equal(summary.invalid.length, 1);
  assert.match(summary.invalid[0]?.errors.join("\n") ?? "", /파일 이름/u);

  const matched = exampleObject();
  matched["task_id"] = "P0-T33";
  assert.equal(
    summarizeReviews(
      [{ file: `${REVIEWS_DIRECTORY}/P0-T33-review.json`, text: JSON.stringify(matched) }],
      null,
    ).status,
    "ok",
  );
});

test("reviews — participants를 읽지 못하면 발견마다 원인을 오인하는 오류를 내지 않는다", () => {
  const broken = exampleObject();
  broken["participants"] = "opus, codex";

  const parsed = parseReviewDocument(JSON.stringify(broken));

  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    const subsetErrors = parsed.errors.filter((error) =>
      error.includes("participants에 없는 리뷰어"),
    );
    assert.deepEqual(subsetErrors, [], "participants 파싱 실패가 agreed_by 오류로 번졌다");
    assert.match(parsed.errors.join("\n"), /participants는 배열이어야 합니다/u);
  }
});

test("reviews — task 결과 파일의 scope 필드는 형식 오류다", () => {
  const scoped = exampleObject();
  scoped["scope"] = "full-scan";

  const parsed = parseReviewDocument(JSON.stringify(scoped));

  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    assert.match(parsed.errors.join("\n"), /scope/u);
  }
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

  const summary = summarizeReviews(
    [documentOf("P0-T31", newer), documentOf("P0-T30", older)],
    null,
  );

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

  assert.deepEqual(backlog.malformed, [], "코드블록 예시가 항목으로 세어졌다");
  assert.ok(
    markdown.includes("- [ ] [severity] [task-id]"),
    "코드블록 예시 줄이 남아 있어야 이 회귀 테스트가 의미를 갖는다",
  );
});

test("reviews — backlog 파일이 없으면 빈 목록으로 처리한다", () => {
  const backlog = parseBacklog(null);

  assert.deepEqual(backlog.open, []);
  assert.deepEqual(backlog.resolved, []);
  assert.deepEqual(backlog.malformed, []);
});
