import { readFileSync } from "node:fs";

const ADR_FILE =
  "docs/2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md";
const CLAUDE_FILE = "CLAUDE.md";

const ENFORCEMENT_FIXTURE = `# 문서

## 집행

검사 셋을 세운다. 이유는 여기에 적는다.

| 규칙 | 막는 것 |
| --- | --- |
| 첫째 | a |
| 둘째 | b |
| 셋째 | c |

다음 표는 세지 않는다.

| 금지 | 지금 |
| --- | --- |
| x | 0 |

## 다음 절

| 규칙 | 막는 것 |
| --- | --- |
| 넷째 | d |
`;

async function loadCounts() {
  const { enforcementRowCount, koreanNumber, statedCheckCount } =
    await import("@tests/lint/docCounts");

  return { enforcementRowCount, koreanNumber, statedCheckCount };
}

describe("한글 수 읽기", () => {
  it.each([
    ["열", 10],
    ["열일곱", 17],
    ["스물", 20],
    ["스물셋", 23],
    ["서른", 30],
    ["서른아홉", 39],
  ])("%s를 %i로 읽는다", async (word, expected) => {
    const { koreanNumber } = await loadCounts();

    expect(koreanNumber(word)).toBe(expected);
  });
});

describe("집행 표의 행 수", () => {
  it("「집행」 절의 첫 표에서 머리글을 뺀 행만 센다", async () => {
    const { enforcementRowCount } = await loadCounts();

    expect(enforcementRowCount(ENFORCEMENT_FIXTURE)).toBe(3);
  });
});

describe("문서가 말하는 검사 수", () => {
  it("「검사 <한글 수>」에서 수를 읽는다", async () => {
    const { statedCheckCount } = await loadCounts();

    expect(statedCheckCount("검사 스물셋을 세운다.")).toBe(23);
    expect(statedCheckCount("그래서 검사 열일곱을 세운다.")).toBe(17);
  });

  it("그 글자가 없으면 null이다", async () => {
    const { statedCheckCount } = await loadCounts();

    expect(statedCheckCount("검사를 세운다.")).toBeNull();
  });
});

describe("저장소 실물", () => {
  it("ADR-015 「집행」 절의 「검사 <한글 수>」가 집행 표 행 수와 같다", async () => {
    const { enforcementRowCount, statedCheckCount } = await loadCounts();
    const adr = readFileSync(ADR_FILE, "utf8");

    expect(statedCheckCount(adr)).toBe(enforcementRowCount(adr));
  });

  it("`CLAUDE.md`의 「검사 <한글 수>」가 집행 표 행 수와 같다", async () => {
    const { enforcementRowCount, statedCheckCount } = await loadCounts();
    const adr = readFileSync(ADR_FILE, "utf8");
    const claude = readFileSync(CLAUDE_FILE, "utf8");

    expect(statedCheckCount(claude)).toBe(enforcementRowCount(adr));
  });
});
