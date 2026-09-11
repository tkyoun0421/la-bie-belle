import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { docLinkViolations } from "@tests/lint/doc-links";

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), "doc-links-"));
}

function write(root: string, relative: string, body: string) {
  const absolute = join(root, relative);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, body);
}

describe("문서 링크 검사", () => {
  it("상대 링크가 가리키는 파일이 없으면 missing-file을 잡는다", () => {
    const root = tempRoot();
    write(root, "docs/a.md", "# A\n\n[링크](docs/nowhere.md)\n");

    expect(docLinkViolations(root)).toEqual([
      {
        file: "docs/a.md",
        href: "docs/nowhere.md",
        line: 3,
        kind: "missing-file",
      },
    ]);
  });

  it("파일은 있지만 #앵커가 그 파일의 제목에 없으면 missing-anchor를 잡는다", () => {
    const root = tempRoot();
    write(root, "docs/a.md", "# A\n\n[링크](docs/b.md#없는-앵커)\n");
    write(root, "docs/b.md", "# B\n\n## 있는 절\n");

    expect(docLinkViolations(root)).toEqual([
      {
        file: "docs/a.md",
        href: "docs/b.md#없는-앵커",
        line: 3,
        kind: "missing-anchor",
      },
    ]);
  });

  it("http·https·mailto 링크는 검사하지 않는다", () => {
    const root = tempRoot();
    write(
      root,
      "docs/a.md",
      [
        "# A",
        "",
        "[외부](https://example.com/nowhere)",
        "[http](http://example.com/nowhere)",
        "[메일](mailto:someone@example.com)",
        "",
      ].join("\n"),
    );

    expect(docLinkViolations(root)).toEqual([]);
  });

  it("#절만 있는 링크는 같은 파일 기준으로 앵커를 찾는다", () => {
    const root = tempRoot();
    write(
      root,
      "docs/a.md",
      ["# A", "", "## 있는 절", "", "[자기 참조](#없는-절)"].join("\n"),
    );

    expect(docLinkViolations(root)).toEqual([
      {
        file: "docs/a.md",
        href: "#없는-절",
        line: 5,
        kind: "missing-anchor",
      },
    ]);
  });

  it("../가 든 상대 경로가 실제 파일을 올바르게 찾아낸다", () => {
    const root = tempRoot();
    write(root, "docs/2-design/spec/x.md", "# X\n\n[상위](../../handoff.md)\n");
    write(root, "docs/handoff.md", "# Handoff\n");

    expect(docLinkViolations(root)).toEqual([]);
  });

  it("../가 든 상대 경로가 존재하지 않는 파일을 가리키면 missing-file로 잡는다", () => {
    const root = tempRoot();
    write(root, "docs/2-design/spec/x.md", "# X\n\n[상위](../../nowhere.md)\n");

    expect(docLinkViolations(root)).toEqual([
      {
        file: "docs/2-design/spec/x.md",
        href: "../../nowhere.md",
        line: 3,
        kind: "missing-file",
      },
    ]);
  });

  it("docs/log/ 아래 파일의 깨진 링크는 검사 대상이 아니다", () => {
    const root = tempRoot();
    write(
      root,
      "docs/log/2026-09-01.md",
      "# 회차\n\n[깨짐](docs/nowhere.md)\n",
    );

    expect(docLinkViolations(root)).toEqual([]);
  });
});

describe("문서 링크 검사 — 실제 저장소 회귀", () => {
  it("현재 저장소 docs/ 아래에 깨진 링크가 없다 (회귀)", () => {
    expect(docLinkViolations(process.cwd())).toEqual([]);
  });
});
