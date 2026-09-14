import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  designMapViolations,
  designMaps,
  screenDirs,
} from "@tests/lint/design-map";

function tempScreensDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "design-map-"));
  mkdirSync(join(dir, "screens"));
  return join(dir, "screens");
}

function mapWithLinkedScreens(dir: string, ...screens: string[]) {
  const bullets = screens
    .map((screen) => `- [screens/${screen}](screens/${screen}) — 지어낸 항목`)
    .join("\n");

  return {
    markdown: `# 디자인 시스템

## 문서 지도

무엇이 어디 있는지는 이 절이 정본이다.

${bullets}

## 두 축

값은 tokens.md에만 적는다.
`,
    dir,
    heading: "문서 지도",
  };
}

describe("화면 문서 지도 검사", () => {
  it("지도에 링크 안 된 화면 문서를 검출한다", () => {
    const screens = tempScreensDir();
    writeFileSync(join(screens, "a.md"), "# A\n");
    writeFileSync(join(screens, "b.md"), "# B\n");
    writeFileSync(join(screens, "b.sian.html"), "<html></html>\n");

    const map = mapWithLinkedScreens(join(screens, ".."), "a.md");

    expect(designMapViolations([map], [screens])).toEqual([
      join(screens, "b.md"),
    ]);
  });

  it("화면 문서가 전부 링크돼 있으면 위반이 없다", () => {
    const screens = tempScreensDir();
    writeFileSync(join(screens, "a.md"), "# A\n");
    writeFileSync(join(screens, "b.md"), "# B\n");
    writeFileSync(join(screens, "b.sian.html"), "<html></html>\n");

    const map = mapWithLinkedScreens(join(screens, ".."), "a.md", "b.md");

    expect(designMapViolations([map], [screens])).toEqual([]);
  });

  it("지도가 여럿이면 어느 지도에 걸려도 된다", () => {
    const first = tempScreensDir();
    const second = tempScreensDir();
    writeFileSync(join(first, "a.md"), "# A\n");
    writeFileSync(join(second, "b.md"), "# B\n");

    const maps = [
      mapWithLinkedScreens(join(first, ".."), "a.md"),
      mapWithLinkedScreens(join(second, ".."), "b.md"),
    ];

    expect(designMapViolations(maps, [first, second])).toEqual([]);
  });

  it("「문서 지도」 절 밖의 링크는 안 센다", () => {
    const screens = tempScreensDir();
    writeFileSync(join(screens, "a.md"), "# A\n");

    const map = {
      markdown: `# 디자인 시스템

## 문서 지도

무엇이 어디 있는지는 이 절이 정본이다.

- \`screens/*.sian.html\` — 화면별 시안

## 페이지별 디자인

첫 파일이 [screens/a.md](screens/a.md)고 뒤따르는 화면은 이 틀을 따른다.
`,
      dir: join(screens, ".."),
      heading: "문서 지도",
    };

    expect(designMapViolations([map], [screens])).toEqual([
      join(screens, "a.md"),
    ]);
  });
});

describe("화면 문서 지도 검사 — 실제 저장소 회귀", () => {
  it("화면 문서가 전부 어느 지도엔가 걸려 있다 (회귀)", () => {
    expect(designMapViolations(designMaps(), screenDirs())).toEqual([]);
  });
});
