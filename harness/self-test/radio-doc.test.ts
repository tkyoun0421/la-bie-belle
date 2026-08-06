import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hasCodePaths,
  parseAllowedPaths,
  parseRiskLensTable,
  RISK_LENS_COLUMNS,
  RISK_LENS_HEADING,
} from "../lib/radio-doc.ts";

function wrapSection(lines: readonly string[]): string {
  return ["# 테스트 RADIO", "", "## Requirements", "", ...lines, ""].join("\n");
}

const HEADER_ROW = `| ${RISK_LENS_COLUMNS.join(" | ")} |`;
const SEPARATOR_ROW = `| ${RISK_LENS_COLUMNS.map(() => "---").join(" | ")} |`;

test("parseRiskLensTable — 정상 표는 ok kind와 행 데이터를 반환한다", () => {
  const bodyRow =
    "| 정상 로그인 | 테스트함 | 테스트함(실패 케이스) | 테스트함 | 해당 없음 — 인증 화면이라 분기가 없다 | 테스트함 | 테스트함 |";
  const markdown = wrapSection([RISK_LENS_HEADING, "", HEADER_ROW, SEPARATOR_ROW, bodyRow]);

  const result = parseRiskLensTable(markdown);

  assert.equal(result.kind, "ok");
  if (result.kind !== "ok") {
    return;
  }
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0]?.criterion, "정상 로그인");
  assert.equal(result.rows[0]?.cells.get("Happy Path"), "테스트함");
  assert.equal(result.rows[0]?.cells.get("동시성"), "테스트함");
  assert.equal(result.rows[0]?.line, markdown.split("\n").indexOf(bodyRow) + 1);
});

test("parseRiskLensTable — 절이 없으면 missing이다", () => {
  const markdown = wrapSection(["- 위험 렌즈 절 자체가 없는 문서다."]);

  assert.deepEqual(parseRiskLensTable(markdown), { kind: "missing" });
});

test("parseRiskLensTable — 절은 있으나 표가 없으면 missing이다", () => {
  const markdown = wrapSection([RISK_LENS_HEADING, "", "표를 아직 쓰지 않았다."]);

  assert.deepEqual(parseRiskLensTable(markdown), { kind: "missing" });
});

test("parseRiskLensTable — 헤더가 정본과 다르면 header-mismatch와 헤더 행 번호를 반환한다", () => {
  const badHeader = "| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 동시성 |";
  const markdown = wrapSection([RISK_LENS_HEADING, "", badHeader, SEPARATOR_ROW]);

  const result = parseRiskLensTable(markdown);

  assert.equal(result.kind, "header-mismatch");
  if (result.kind !== "header-mismatch") {
    return;
  }
  assert.equal(result.line, markdown.split("\n").indexOf(badHeader) + 1);
});

test("parseRiskLensTable — 구분자 열 수가 헤더와 다르면 separator-mismatch와 구분자 행 번호를 반환한다", () => {
  const badSeparator = "| --- | --- | --- |";
  const markdown = wrapSection([RISK_LENS_HEADING, "", HEADER_ROW, badSeparator]);

  const result = parseRiskLensTable(markdown);

  assert.equal(result.kind, "separator-mismatch");
  if (result.kind !== "separator-mismatch") {
    return;
  }
  assert.equal(result.line, markdown.split("\n").indexOf(badSeparator) + 1);
});

test("parseRiskLensTable — 구분자 행이 아예 없으면 separator-mismatch다", () => {
  const markdown = wrapSection([RISK_LENS_HEADING, "", HEADER_ROW]);

  const result = parseRiskLensTable(markdown);

  assert.equal(result.kind, "separator-mismatch");
});

test("parseRiskLensTable — 인수 조건 칸이 공백만이면 정규화된 빈 문자열 criterion을 반환한다", () => {
  const blankRow = "|    | 테스트함 | 테스트함 | 테스트함 | 테스트함 | 테스트함 | 테스트함 |";
  const markdown = wrapSection([RISK_LENS_HEADING, "", HEADER_ROW, SEPARATOR_ROW, blankRow]);

  const result = parseRiskLensTable(markdown);

  assert.equal(result.kind, "ok");
  if (result.kind !== "ok") {
    return;
  }
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0]?.criterion, "");
});

test("parseRiskLensTable — criterion 칸의 연속 공백을 한 칸으로 정규화한다", () => {
  const spacedRow =
    "| 정상   로그인  성공 | 테스트함 | 테스트함 | 테스트함 | 테스트함 | 테스트함 | 테스트함 |";
  const markdown = wrapSection([RISK_LENS_HEADING, "", HEADER_ROW, SEPARATOR_ROW, spacedRow]);

  const result = parseRiskLensTable(markdown);

  assert.equal(result.kind, "ok");
  if (result.kind !== "ok") {
    return;
  }
  assert.equal(result.rows[0]?.criterion, "정상 로그인 성공");
});

test("parseRiskLensTable — 표에 행이 없으면 ok kind에 빈 rows를 반환한다", () => {
  const markdown = wrapSection([RISK_LENS_HEADING, "", HEADER_ROW, SEPARATOR_ROW]);

  const result = parseRiskLensTable(markdown);

  assert.equal(result.kind, "ok");
  if (result.kind !== "ok") {
    return;
  }
  assert.equal(result.rows.length, 0);
  assert.equal(result.headerLine, markdown.split("\n").indexOf(HEADER_ROW) + 1);
});

test("hasCodePaths — docs·.claude 경로만 있으면 false다", () => {
  assert.equal(hasCodePaths(["docs/**", ".claude/**"]), false);
});

test("hasCodePaths — 코드 경로가 섞이면 true다", () => {
  assert.equal(hasCodePaths(["docs/**", "harness/lib/**"]), true);
});

test("hasCodePaths — 빈 배열은 false다", () => {
  assert.equal(hasCodePaths([]), false);
});

test("hasCodePaths — 주석 형태 문자열은 코드 경로로 취급한다(주석 필터링은 parseAllowedPaths 책임)", () => {
  assert.equal(hasCodePaths(["# harness/lib/**"]), true);
});

test("hasCodePaths — 앞 공백이 붙은 변형은 docs 접두 판정에서 벗어나 코드 경로로 취급한다", () => {
  assert.equal(hasCodePaths([" docs/**"]), true);
});

test("hasCodePaths — 뒤 공백이 붙은 변형은 여전히 docs 접두 판정을 통과한다", () => {
  assert.equal(hasCodePaths(["docs/** "]), false);
});

test("parseAllowedPaths가 주석·공백 줄을 걸러낸 뒤 hasCodePaths가 정상 판별한다", () => {
  const markdown = ["## 변경 허용 경로", "", "```", "# 주석", "  ", "docs/**", "```", ""].join(
    "\n",
  );

  assert.equal(hasCodePaths(parseAllowedPaths(markdown)), false);
});
