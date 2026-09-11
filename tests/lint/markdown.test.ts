import { describe, expect, it } from "vitest";
import { parseMarkdown } from "@tests/lint/markdown";

describe("마크다운 구조 읽기 — 제목", () => {
  it("제목의 급·글·줄 번호를 읽는다", () => {
    const source = ["# 제목", "", "## 소제목", "글", "### 더 깊은 제목"].join(
      "\n",
    );

    expect(parseMarkdown(source).headings).toEqual([
      { level: 1, text: "제목", slug: "제목", line: 1 },
      { level: 2, text: "소제목", slug: "소제목", line: 3 },
      { level: 3, text: "더 깊은 제목", slug: "더-깊은-제목", line: 5 },
    ]);
  });

  it("슬러그는 한글을 그대로 남기고 공백을 -로 바꾼다", () => {
    const source = "## 문서 지도";

    expect(parseMarkdown(source).headings).toEqual([
      { level: 2, text: "문서 지도", slug: "문서-지도", line: 1 },
    ]);
  });

  it("슬러그는 백틱 코드를 벗기고 안의 글자만 남긴다", () => {
    const source = "## `docs/log/`는 검사 밖";

    expect(parseMarkdown(source).headings).toEqual([
      {
        level: 2,
        text: "docs/log/는 검사 밖",
        slug: "docslog는-검사-밖",
        line: 1,
      },
    ]);
  });

  it("슬러그는 별표 강조를 벗기고 안의 글자만 남긴다", () => {
    const source = "## **강조** 제목";

    expect(parseMarkdown(source).headings).toEqual([
      { level: 2, text: "강조 제목", slug: "강조-제목", line: 1 },
    ]);
  });

  it("슬러그는 구두점(·, —, 괄호, ?)을 지운다", () => {
    const source = "## 하나·둘—셋(넷)?";

    expect(parseMarkdown(source).headings).toEqual([
      {
        level: 2,
        text: "하나·둘—셋(넷)?",
        slug: "하나둘셋넷",
        line: 1,
      },
    ]);
  });

  it("슬러그는 구두점을 지우되 공백은 -로 남긴다", () => {
    const source = "## 하나(둘) 셋";

    expect(parseMarkdown(source).headings).toEqual([
      { level: 2, text: "하나(둘) 셋", slug: "하나둘-셋", line: 1 },
    ]);
  });

  it("제목 글의 앞뒤 공백을 지운다", () => {
    const source = "##   앞뒤 공백   ";

    expect(parseMarkdown(source).headings).toEqual([
      { level: 2, text: "앞뒤 공백", slug: "앞뒤-공백", line: 1 },
    ]);
  });

  it("같은 제목이 셋이면 둘째부터 -1, -2가 붙는다", () => {
    const source = ["## 색", "내용1", "## 색", "내용2", "## 색"].join("\n");

    expect(parseMarkdown(source).headings).toEqual([
      { level: 2, text: "색", slug: "색", line: 1 },
      { level: 2, text: "색", slug: "색-1", line: 3 },
      { level: 2, text: "색", slug: "색-2", line: 5 },
    ]);
  });
});

describe("마크다운 구조 읽기 — 링크", () => {
  it("정상 링크와 이미지 링크가 줄 번호와 같이 들어간다", () => {
    const source = ["[문서](docs/handoff.md)", "![그림](docs/img/a.png)"].join(
      "\n",
    );

    expect(parseMarkdown(source).links).toEqual([
      { href: "docs/handoff.md", line: 1 },
      { href: "docs/img/a.png", line: 2 },
    ]);
  });

  it("코드블록 안의 링크는 안 잡는다", () => {
    const source = [
      "[일반 링크](docs/a.md)",
      "```",
      "[코드블록 링크](docs/b.md)",
      "```",
      "[다시 일반](docs/c.md)",
    ].join("\n");

    expect(parseMarkdown(source).links).toEqual([
      { href: "docs/a.md", line: 1 },
      { href: "docs/c.md", line: 5 },
    ]);
  });

  it("인라인 코드 안의 링크는 안 잡는다", () => {
    const source = "본문 `[가짜 링크](docs/x.md)` 그리고 [진짜](docs/y.md)";

    expect(parseMarkdown(source).links).toEqual([
      { href: "docs/y.md", line: 1 },
    ]);
  });

  it("코드블록이 안 닫힌 채 끝나도 throw 없이 그 뒤를 코드로 본다", () => {
    const source = ["[일반](docs/a.md)", "```", "[코드 안](docs/b.md)"].join(
      "\n",
    );

    expect(() => parseMarkdown(source)).not.toThrow();
    expect(parseMarkdown(source).links).toEqual([
      { href: "docs/a.md", line: 1 },
    ]);
  });
});

describe("마크다운 구조 읽기 — 코드스팬", () => {
  it("백틱 안 글이 정확히 뽑힌다", () => {
    const source = "본문에 `code span` 하나와 `another` 둘";

    expect(parseMarkdown(source).codeSpans).toEqual([
      { text: "code span", line: 1 },
      { text: "another", line: 1 },
    ]);
  });
});

describe("마크다운 구조 읽기 — 절", () => {
  it("절은 다음 같은 급 제목 전까지의 본문 줄이다", () => {
    const source = [
      "# 문서",
      "",
      "## 첫 절",
      "첫 번째 줄",
      "",
      "## 둘째 절",
      "다른 내용",
    ].join("\n");

    expect(parseMarkdown(source).section("첫 절")).toEqual(["첫 번째 줄", ""]);
  });

  it("절은 하위 급 제목을 포함한다", () => {
    const source = [
      "## 절",
      "내용",
      "### 하위 절",
      "하위 내용",
      "## 다음 절",
      "다음 내용",
    ].join("\n");

    expect(parseMarkdown(source).section("절")).toEqual([
      "내용",
      "### 하위 절",
      "하위 내용",
    ]);
  });

  it("다음 같은 급 제목이 없으면 문서 끝까지가 절이다", () => {
    const source = ["## 마지막 절", "내용1", "내용2"].join("\n");

    expect(parseMarkdown(source).section("마지막 절")).toEqual([
      "내용1",
      "내용2",
    ]);
  });

  it("없는 제목을 찾으면 빈 배열을 돌려준다", () => {
    const source = ["## 있는 절", "내용"].join("\n");

    expect(parseMarkdown(source).section("존재안함")).toEqual([]);
  });
});
