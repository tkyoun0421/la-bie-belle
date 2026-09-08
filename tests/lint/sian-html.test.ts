import { describe, expect, it } from "vitest";
import { sianHtmlViolations, sianHtmlFiles } from "@tests/lint/sian-html";

describe("시안 HTML 구조 검사", () => {
  it("저장소의 시안 파일이 전부 태그 균형을 지킨다 (회귀)", () => {
    const files = sianHtmlFiles();
    expect(files.length).toBeGreaterThan(0);

    const violations = files.flatMap((file) => sianHtmlViolations(file));
    expect(violations).toEqual([]);
  });

  it("안 닫힌 여는 태그를 줄 번호와 함께 잡는다", () => {
    const source = [
      '<div class="a">',
      '  <div class="b">',
      "    <span>글</span>",
      "  </div>",
    ].join("\n");

    const violations = sianHtmlViolations("fake.sian.html", source);

    expect(violations).toEqual([
      { file: "fake.sian.html", kind: "unclosed", tag: "div", line: 1 },
    ]);
  });

  it("짝 없는 닫는 태그를 잡는다", () => {
    const source = ["<div>", "  <span>글</span>", "</div>", "</div>"].join(
      "\n",
    );

    const violations = sianHtmlViolations("fake.sian.html", source);

    expect(violations).toEqual([
      { file: "fake.sian.html", kind: "stray-close", tag: "div", line: 4 },
    ]);
  });

  it("엇갈려 닫힌 태그는 덮인 쪽과 짝 잃은 쪽을 다 잡는다", () => {
    const source = ["<div>", "  <span>글</div>", "</span>"].join("\n");

    const violations = sianHtmlViolations("fake.sian.html", source);

    expect(violations).toEqual([
      { file: "fake.sian.html", kind: "unclosed", tag: "span", line: 2 },
      { file: "fake.sian.html", kind: "stray-close", tag: "span", line: 3 },
    ]);
  });

  it("void 요소와 self-closing 요소는 열린 것으로 세지 않는다", () => {
    const source = [
      "<div>",
      '  <meta charset="utf-8">',
      "  <br>",
      '  <img src="a.png">',
      '  <svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6" /><rect x="1" y="1" /></svg>',
      "</div>",
    ].join("\n");

    expect(sianHtmlViolations("fake.sian.html", source)).toEqual([]);
  });

  it("script와 style 안의 태그 모양 문자열은 안 센다", () => {
    const source = [
      "<div>",
      "  <style>.a::before { content: '<div>'; }</style>",
      "  <script>var CHECK = '<svg><path d=\"M4 12\"/></svg>';</script>",
      "</div>",
    ].join("\n");

    expect(sianHtmlViolations("fake.sian.html", source)).toEqual([]);
  });

  it("주석 안의 태그는 안 센다", () => {
    const source = [
      "<div>",
      "  <!-- <div> 여는 태그만 있는 주석 -->",
      "</div>",
    ].join("\n");

    expect(sianHtmlViolations("fake.sian.html", source)).toEqual([]);
  });

  it("한 파일에 어긋남이 여럿이면 여럿을 돌려준다", () => {
    const source = ["<div>", "<section>", "</div>"].join("\n");

    const violations = sianHtmlViolations("fake.sian.html", source);

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ kind: "unclosed", tag: "section" });
  });
});
