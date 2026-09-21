import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { changelogViolations } from "@tests/lint/changelog";

function changelogFixture(...prNumbers: number[]): string {
  const rows = prNumbers
    .map((n) => `| 2026-09-0${n % 9} | 지어낸 변경 ${n} | #${n} |`)
    .join("\n");

  return `# CHANGELOG

| 날짜       | 변경          | PR   |
| ---------- | ------------- | ---- |
${rows}
`;
}

describe("CHANGELOG—log PR 일치 검사", () => {
  it("로그가 언급하지만 CHANGELOG에 없는 PR 번호를 검출한다", () => {
    const changelog = changelogFixture(230, 229);
    const logs = [
      "회차 기록. #228과 #230을 다뤘다.",
      "이어서 #240을 마무리했다.",
    ];

    expect(changelogViolations(changelog, logs)).toEqual([240]);
  });

  it("로그가 언급한 PR 번호가 전부 CHANGELOG에 있으면 위반이 없다", () => {
    const changelog = changelogFixture(230, 229);
    const logs = [
      "회차 기록. #228과 #230을 다뤘다.",
      "이어서 #229를 마무리했다.",
    ];

    expect(changelogViolations(changelog, logs)).toEqual([]);
  });

  it("CHANGELOG 시작 번호보다 작은 로그 번호는 이전 이력이라 안 센다", () => {
    const changelog = changelogFixture(230, 229);
    const logs = ["옛 회차. #156을 다뤘다."];

    expect(changelogViolations(changelog, logs)).toEqual([]);
  });

  it("CHANGELOG에 PR 번호가 하나도 없으면 위반이 없다", () => {
    const changelog =
      "# CHANGELOG\n\n| 날짜 | 변경 | PR |\n| --- | --- | --- |\n";
    const logs = ["#240을 언급한다."];

    expect(changelogViolations(changelog, logs)).toEqual([]);
  });
});

describe("CHANGELOG—log PR 일치 검사 — 실제 저장소 회귀", () => {
  it("docs/log/ 전체가 언급하는 PR 번호가 CHANGELOG에 다 있다 (회귀)", () => {
    const changelog = readFileSync(
      join(process.cwd(), "docs/CHANGELOG.md"),
      "utf8",
    );
    const logDir = join(process.cwd(), "docs/log");
    const logs = readdirSync(logDir)
      .filter((file) => file.endsWith(".md"))
      .map((file) => readFileSync(join(logDir, file), "utf8"));

    expect(changelogViolations(changelog, logs)).toEqual([]);
  });
});
