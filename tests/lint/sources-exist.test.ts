import {
  allSourcesViolations,
  sourcesViolations,
} from "@tests/lint/sources-exist";
import {
  frontmatterSources,
  frontmatterStatus,
  sourceDocFiles,
} from "@tests/lint/spec-docs";

const SPEC = "docs/2-design/spec/fixture.md";

function fixture(sources: string[]): string {
  const lines = sources.map((source) => `  - ${source}`).join("\n");

  return `---
status: draft
sources:
${lines}
---

# 지어낸 기능
`;
}

describe("sources 경로·앵커 실존 검사", () => {
  it("현재 저장소의 spec·plan frontmatter sources는 전부 실존한다 (회귀)", () => {
    expect(allSourcesViolations()).toEqual([]);
  });

  it("spec과 plan을 둘 다 대상으로 든다 (회귀)", () => {
    const files = sourceDocFiles();

    expect(files).toContain("docs/2-design/spec/dashboard.md");
    expect(files).toContain("docs/3-build/plans/docs-authoring-playbook.md");
  });

  it("실존하지 않는 상대 경로를 검출한다", () => {
    const violations = sourcesViolations(
      SPEC,
      fixture(["../modules/nowhere/README.md"]),
    );

    expect(violations).toEqual([
      {
        file: SPEC,
        source: "../modules/nowhere/README.md",
        kind: "missing-file",
      },
    ]);
  });

  it("파일은 있는데 규칙 ID 앵커가 없으면 검출한다", () => {
    const violations = sourcesViolations(
      SPEC,
      fixture(["../modules/attendance/README.md#att-999"]),
    );

    expect(violations).toEqual([
      {
        file: SPEC,
        source: "../modules/attendance/README.md#att-999",
        kind: "missing-anchor",
      },
    ]);
  });

  it("실존하는 규칙 ID 앵커는 위반이 아니다", () => {
    const violations = sourcesViolations(
      SPEC,
      fixture(["../modules/attendance/README.md#att-017"]),
    );

    expect(violations).toEqual([]);
  });

  it("앵커 없는 실존 경로는 위반이 아니다", () => {
    expect(
      sourcesViolations(SPEC, fixture(["../system/screens/dashboard.md"])),
    ).toEqual([]);
  });

  it("frontmatter가 없으면 sources도 status도 없다", () => {
    expect(frontmatterSources("# 제목\n")).toEqual([]);
    expect(frontmatterStatus("# 제목\n")).toBeNull();
  });

  it("status와 sources 목록을 함께 읽는다", () => {
    const markdown = fixture(["../system/screens/dashboard.md", "a.md"]);

    expect(frontmatterStatus(markdown)).toBe("draft");
    expect(frontmatterSources(markdown)).toEqual([
      "../system/screens/dashboard.md",
      "a.md",
    ]);
  });
});
