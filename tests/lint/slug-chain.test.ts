import { describe, expect, it } from "vitest";
import { type BacklogRow } from "@tests/lint/backlog-ids";
import {
  backlogSlugViolations,
  slugChainViolations,
  sourcesSlugViolations,
} from "@tests/lint/slug-chain";

function backlogRow(
  id: string,
  status: string,
  documents: string[],
): BacklogRow {
  return { id, status, prerequisites: [], documents, line: 1 };
}

describe("사슬 슬러그 일치 검사", () => {
  it("현재 저장소의 사슬은 슬러그가 어긋난 자리가 없다 (회귀)", () => {
    expect(slugChainViolations()).toEqual([]);
  });

  it("plan이 다른 슬러그의 spec을 sources로 들면 검출한다", () => {
    const violations = sourcesSlugViolations([
      {
        file: "docs/3-build/plans/alpha.md",
        status: null,
        sources: ["../../2-design/spec/beta.md"],
      },
    ]);

    expect(violations).toEqual([
      {
        file: "docs/3-build/plans/alpha.md",
        slug: "alpha",
        linked: "docs/2-design/spec/beta.md",
        kind: "sources-slug",
      },
    ]);
  });

  it("spec이 다른 슬러그의 intent를 sources로 들면 검출한다", () => {
    const violations = sourcesSlugViolations([
      {
        file: "docs/2-design/spec/alpha.md",
        status: "approved",
        sources: ["../../1-plan/intent/beta.md#요구"],
      },
    ]);

    expect(violations).toEqual([
      {
        file: "docs/2-design/spec/alpha.md",
        slug: "alpha",
        linked: "docs/1-plan/intent/beta.md",
        kind: "sources-slug",
      },
    ]);
  });

  it("같은 슬러그로 이어지면 위반이 아니다", () => {
    const violations = sourcesSlugViolations([
      {
        file: "docs/3-build/plans/alpha.md",
        status: null,
        sources: ["../../2-design/spec/alpha.md", "../../proposals/other.md"],
      },
    ]);

    expect(violations).toEqual([]);
  });

  it("backlog 행의 문서 링크 슬러그가 작업 ID와 다르면 검출한다", () => {
    const violations = backlogSlugViolations([
      backlogRow("alpha", "ready", ["3-build/plans/beta.md"]),
    ]);

    expect(violations).toEqual([
      {
        file: "docs/backlog.md",
        slug: "alpha",
        linked: "3-build/plans/beta.md",
        kind: "backlog-slug",
      },
    ]);
  });

  it("작업 ID와 같은 슬러그면 위반이 아니다", () => {
    expect(
      backlogSlugViolations([
        backlogRow("alpha", "active", ["2-design/spec/alpha.md"]),
      ]),
    ).toEqual([]);
  });

  it("done 행은 범위 밖이다", () => {
    expect(
      backlogSlugViolations([
        backlogRow("alpha", "done", ["3-build/plans/beta.md"]),
      ]),
    ).toEqual([]);
  });
});
