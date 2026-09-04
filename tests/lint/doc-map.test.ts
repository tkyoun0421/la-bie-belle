import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { docMapViolations } from "@tests/lint/doc-map";

const FAKE_MISSING_PATH = "docs/9-nowhere/ghost.md";

function fixtureWithMapBullet(bulletPath: string): string {
  return `# la-bie-belle

## 문서 지도

무엇이 어디 있는지는 이 절이 정본이다.

- \`docs/handoff.md\` — 지금 상태와 다음 첫 수
- \`${bulletPath}\` — 지어낸 항목

## 스택과 명령어

Next.js 16.
`;
}

describe("문서 지도 일치 검사", () => {
  it("현재 저장소의 CLAUDE.md 문서 지도 불릿 경로는 전부 실존한다 (회귀)", () => {
    const claudeMd = readFileSync(
      path.join(process.cwd(), "CLAUDE.md"),
      "utf8",
    );

    expect(docMapViolations(claudeMd)).toEqual([]);
  });

  it("실존하지 않는 docs/ 경로가 불릿에 있으면 검출한다", () => {
    const fixture = fixtureWithMapBullet(FAKE_MISSING_PATH);

    expect(docMapViolations(fixture)).toContain(FAKE_MISSING_PATH);
  });

  it("실존하는 경로만 있으면 위반이 없다", () => {
    const fixture = fixtureWithMapBullet("docs/backlog.md");

    expect(docMapViolations(fixture)).toEqual([]);
  });

  it("「문서 지도」절 밖에서 언급한 실존하지 않는 docs/ 경로는 대상이 아니다", () => {
    const fixture = `# la-bie-belle

## 문서 지도

- \`docs/handoff.md\` — 지금 상태와 다음 첫 수

## 흐름

세부는 \`${FAKE_MISSING_PATH}\`를 본다.
`;

    expect(docMapViolations(fixture)).toEqual([]);
  });
});
