import {
  type ImpactDoc,
  checkImpactSection,
  findImpacted,
} from "@tests/lint/sources-impact";

const APPROVED_SPEC: ImpactDoc = {
  file: "docs/2-design/spec/alpha.md",
  status: "approved",
  sources: [
    "../../1-plan/intent/alpha.md",
    "../modules/attendance/README.md#att-017",
  ],
};

const DRAFT_SPEC: ImpactDoc = {
  file: "docs/2-design/spec/beta.md",
  status: "draft",
  sources: ["../modules/attendance/README.md"],
};

const RULE = "docs/2-design/modules/attendance/README.md";

describe("승인 뒤 sources 변경의 영향 확인", () => {
  it("승인된 spec의 입력이 바뀌면 그 spec을 돌려준다", () => {
    expect(findImpacted([RULE], [APPROVED_SPEC, DRAFT_SPEC])).toEqual([
      "docs/2-design/spec/alpha.md",
    ]);
  });

  it("#앵커가 붙은 sources도 파일 경로로 맞춘다", () => {
    expect(findImpacted([RULE], [APPROVED_SPEC])).toEqual([
      "docs/2-design/spec/alpha.md",
    ]);
  });

  it("승인 마크가 없는 문서는 대상이 아니다", () => {
    expect(findImpacted([RULE], [DRAFT_SPEC])).toEqual([]);
  });

  it("바뀐 파일이 sources에 없으면 영향이 없다", () => {
    expect(
      findImpacted(["docs/2-design/system/runtime.md"], [APPROVED_SPEC]),
    ).toEqual([]);
  });

  it("영향받은 문서가 있는데 「영향 확인」 절이 없으면 위반이다", () => {
    const body = `## 무엇

규칙 한 줄을 고쳤다.
`;

    expect(checkImpactSection(body, ["docs/2-design/spec/alpha.md"])).toEqual([
      { document: "docs/2-design/spec/alpha.md", kind: "missing-section" },
    ]);
  });

  it("절은 있는데 영향받은 파일명을 안 들면 위반이다", () => {
    const body = `## 영향 확인

영향이 없다.
`;

    expect(checkImpactSection(body, ["docs/2-design/spec/alpha.md"])).toEqual([
      { document: "docs/2-design/spec/alpha.md", kind: "missing-document" },
    ]);
  });

  it("절이 파일명을 들면 위반이 아니다", () => {
    const body = `### 영향 확인

- \`docs/2-design/spec/alpha.md\` — 승인 범위가 그대로다.

## 검증
`;

    expect(checkImpactSection(body, ["docs/2-design/spec/alpha.md"])).toEqual(
      [],
    );
  });

  it("영향받은 문서가 없으면 절을 요구하지 않는다", () => {
    expect(checkImpactSection("", [])).toEqual([]);
  });
});
