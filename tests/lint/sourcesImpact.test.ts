import {
  type ImpactDoc,
  checkImpactSection,
  findImpacted,
} from "@tests/lint/sources-impact";

const TRACKED_SPEC: ImpactDoc = {
  file: "docs/2-design/spec/alpha.md",
  tracked: true,
  sources: [
    "../../1-plan/intent/alpha.md",
    "../modules/attendance/README.md#att-017",
  ],
};

const UNTRACKED_SPEC: ImpactDoc = {
  file: "docs/2-design/spec/beta.md",
  tracked: false,
  sources: ["../modules/attendance/README.md"],
};

const LIVING_PLAN: ImpactDoc = {
  file: "docs/3-build/plans/gamma.md",
  tracked: true,
  sources: ["../../2-design/modules/attendance/README.md"],
};

const FINISHED_PLAN: ImpactDoc = {
  file: "docs/3-build/plans/delta.md",
  tracked: false,
  sources: ["../../2-design/modules/attendance/README.md"],
};

const RULE = "docs/2-design/modules/attendance/README.md";

describe("sources 변경의 영향 확인", () => {
  it("tracked인 spec의 입력이 바뀌면 그 spec을 돌려준다", () => {
    expect(findImpacted([RULE], [TRACKED_SPEC, UNTRACKED_SPEC])).toEqual([
      "docs/2-design/spec/alpha.md",
    ]);
  });

  it("#앵커가 붙은 sources도 파일 경로로 맞춘다", () => {
    expect(findImpacted([RULE], [TRACKED_SPEC])).toEqual([
      "docs/2-design/spec/alpha.md",
    ]);
  });

  it("tracked가 아닌 문서는 대상이 아니다", () => {
    expect(findImpacted([RULE], [UNTRACKED_SPEC])).toEqual([]);
  });

  it("바뀐 파일이 sources에 없으면 영향이 없다", () => {
    expect(
      findImpacted(["docs/2-design/system/runtime.md"], [TRACKED_SPEC]),
    ).toEqual([]);
  });

  it("살아 있는 plan(tracked: true)의 소스가 바뀌면 그 plan이 돌아온다", () => {
    expect(findImpacted([RULE], [LIVING_PLAN])).toEqual([
      "docs/3-build/plans/gamma.md",
    ]);
  });

  it("완료된 plan(tracked: false)의 소스가 바뀌어도 돌아오지 않는다", () => {
    expect(findImpacted([RULE], [FINISHED_PLAN])).toEqual([]);
  });

  it("spec과 plan이 섞여 있어도 각각 tracked 기준으로 갈린다", () => {
    expect(
      findImpacted(
        [RULE],
        [TRACKED_SPEC, UNTRACKED_SPEC, LIVING_PLAN, FINISHED_PLAN],
      ),
    ).toEqual(["docs/2-design/spec/alpha.md", "docs/3-build/plans/gamma.md"]);
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
