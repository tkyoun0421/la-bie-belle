import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { designMapViolations } from "@tests/lint/design-map";

function tempPagesDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "design-map-"));
  return dir;
}

function readmeWithLinkedPages(...pages: string[]): string {
  const bullets = pages
    .map((page) => `- [pages/${page}](pages/${page}) — 지어낸 항목`)
    .join("\n");

  return `# 디자인 시스템

## 문서 지도

무엇이 어디 있는지는 이 절이 정본이다.

${bullets}

## 두 축

값은 tokens.md에만 적는다.
`;
}

describe("디자인 시스템 문서 지도 검사", () => {
  it("문서 지도에 링크 안 된 페이지 문서를 검출한다", () => {
    const pagesDir = tempPagesDir();
    writeFileSync(join(pagesDir, "a.md"), "# A\n");
    writeFileSync(join(pagesDir, "b.md"), "# B\n");
    writeFileSync(join(pagesDir, "b.sian.html"), "<html></html>\n");

    const readme = readmeWithLinkedPages("a.md");

    expect(designMapViolations(readme, pagesDir)).toEqual(["pages/b.md"]);
  });

  it("페이지 문서가 전부 링크돼 있으면 위반이 없다", () => {
    const pagesDir = tempPagesDir();
    writeFileSync(join(pagesDir, "a.md"), "# A\n");
    writeFileSync(join(pagesDir, "b.md"), "# B\n");
    writeFileSync(join(pagesDir, "b.sian.html"), "<html></html>\n");

    const readme = readmeWithLinkedPages("a.md", "b.md");

    expect(designMapViolations(readme, pagesDir)).toEqual([]);
  });

  it("「문서 지도」 절 밖의 링크는 안 센다", () => {
    const pagesDir = tempPagesDir();
    writeFileSync(join(pagesDir, "a.md"), "# A\n");

    const readme = `# 디자인 시스템

## 문서 지도

무엇이 어디 있는지는 이 절이 정본이다.

- \`pages/*.sian.html\` — 화면별 시안

## 페이지별 디자인

첫 파일이 [pages/a.md](pages/a.md)고 뒤따르는 화면은 이 틀을 따른다.
`;

    expect(designMapViolations(readme, pagesDir)).toEqual(["pages/a.md"]);
  });
});

describe("디자인 시스템 문서 지도 검사 — 실제 저장소 회귀", () => {
  it("design-system/pages 아래 문서가 전부 README 문서 지도에 걸려 있다 (회귀)", () => {
    const readme = readFileSync(
      join(process.cwd(), "docs/2-design/design-system/README.md"),
      "utf8",
    );
    const pagesDir = join(process.cwd(), "docs/2-design/design-system/pages");

    expect(designMapViolations(readme, pagesDir)).toEqual([]);
  });
});
