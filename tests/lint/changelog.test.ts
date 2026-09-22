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

describe("CHANGELOG—log PR 일치 검사 — 마크다운 링크", () => {
  it("링크 주소가 다른 저장소면 링크 글자 속 번호를 안 센다", () => {
    const changelog = changelogFixture(230, 229);
    const logs = [
      "상위가 [PR #2808](https://github.com/software-mansion/react-native-svg/pull/2808)에서 고쳤다.",
    ];

    expect(changelogViolations(changelog, logs)).toEqual([]);
  });

  it("링크 주소가 우리 저장소면 링크 글자 속 번호를 센다", () => {
    const changelog = changelogFixture(230, 229);
    const logs = [
      "[#380](https://github.com/tkyoun0421/la-bie-belle/pull/380)에서 골격을 세웠다.",
    ];

    expect(changelogViolations(changelog, logs)).toEqual([380]);
  });

  it("링크 없이 맨몸으로 적은 PR 번호는 그대로 센다", () => {
    const changelog = changelogFixture(230, 229);
    const logs = ["#380을 그대로 언급한다."];

    expect(changelogViolations(changelog, logs)).toEqual([380]);
  });

  it("다른 저장소 링크 바로 뒤에 이어지는 맨몸 번호는 삼키지 않고 센다", () => {
    const changelog = changelogFixture(230, 229);
    const logs = [
      "[PR #2808](https://github.com/software-mansion/react-native-svg/pull/2808) #380",
    ];

    expect(changelogViolations(changelog, logs)).toEqual([380]);
  });

  it("실제 회차 로그 문장 꼴에서 다른 저장소 PR 번호를 위반으로 안 잡는다 (회귀)", () => {
    const changelog = changelogFixture(384, 383, 382, 381, 380);
    const logs = [
      "`pnpm lint`·`typecheck`·`test`·`format:check` 어느 것도 Metro를 안 돌려서 [#380](https://github.com/tkyoun0421/la-bie-belle/pull/380)이 골격을 세운 뒤로 아무도 몰랐다. 상위가 [PR #2808](https://github.com/software-mansion/react-native-svg/pull/2808)에서 `Buffer`를 `atob()`로 바꿔 15.15.3에 실었고, Expo SDK 57이 고정한 값은 15.15.4다 — 구버전을 쓰던 것이 원인이지 폴리필이 필요한 문제가 아니었다.",
    ];

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
