import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  repositorySpecGridDocs,
  specGridViolations,
} from "@tests/lint/spec-grid";

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), "spec-grid-"));
}

function write(root: string, relative: string, body: string) {
  const absolute = join(root, relative);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, body);
}

const VALID_SPEC = `---
status: draft
sources:
  - ../../1-plan/intent/fake.md
---

# 가짜 기능

## 완료 조건
### AC-01

- 전제: 사용자가 로그인했다
- 행동: 목록 화면을 연다
- 관찰 결과: 빈 목록 안내가 뜬다
- 검증 층: unit — 목록 계산은 순수 함수다
- 근거: [design.md](../modules/fake/design.md)

### AC-02

- 전제: 사용자가 다시 연다
- 행동: 새로고침한다
- 관찰 결과: 최신 값이 뜬다
- 검증 층: integration — 서버 응답을 확인해야 한다
- 근거: [design.md](../modules/fake/design.md)

## 상태 격자

| 자리 | 무엇이 뜨나 | AC |
| --- | --- | --- |
| 빈 상태 | 빈 목록 안내 | AC-01 |
| 로딩 | 스켈레톤 | AC-01 |
| 실패 | 재시도 배너 | AC-02 |
| 권한 없음 | 해당 없음 — 이 화면은 권한 구분이 없다 | |
| 경계 | 최대 개수 안내 | AC-02 |
| 재진입 | 캐시된 값을 먼저 보여준다 | AC-02 |
| 동시 변경 | 남이 바꾼 값으로 갱신 | AC-02 |
| 성공 직후 | 완료 토스트 | AC-01 |

## 범위 밖

없음.
`;

function withoutGridSection(markdown: string): string {
  return markdown.replace(
    /\n## 상태 격자\n[\s\S]*?\n## 범위 밖/,
    "\n## 범위 밖",
  );
}

describe("상태 격자 절 — 다섯 규칙을 각각 어기면 위반이 잡힌다", () => {
  it("여덟 줄과 AC가 전부 맞으면 위반이 없다", () => {
    expect(specGridViolations(VALID_SPEC)).toEqual([]);
  });

  it("상태 격자 절 자체가 없으면 missing-section 위반이다", () => {
    const markdown = withoutGridSection(VALID_SPEC);

    expect(specGridViolations(markdown)).toEqual([{ type: "missing-section" }]);
  });

  it("여덟 줄 중 하나가 통째로 빠지면 그 줄의 missing-row 위반이다", () => {
    const markdown = VALID_SPEC.replace(
      "| 재진입 | 캐시된 값을 먼저 보여준다 | AC-02 |\n",
      "",
    );

    expect(specGridViolations(markdown)).toEqual([
      { type: "missing-row", state: "재진입" },
    ]);
  });

  it("무엇이 뜨나 칸이 공백만이면 empty-cell 위반이다", () => {
    const markdown = VALID_SPEC.replace(
      "| 실패 | 재시도 배너 | AC-02 |",
      "| 실패 |   | AC-02 |",
    );

    expect(specGridViolations(markdown)).toEqual([
      { type: "empty-cell", state: "실패" },
    ]);
  });

  it("해당 없음만 덩그러니 있고 이유가 없으면 bare-na 위반이다", () => {
    const markdown = VALID_SPEC.replace(
      "| 권한 없음 | 해당 없음 — 이 화면은 권한 구분이 없다 | |",
      "| 권한 없음 | 해당 없음 | |",
    );

    expect(specGridViolations(markdown)).toEqual([
      { type: "bare-na", state: "권한 없음" },
    ]);
  });

  it("해당 없음 뒤에 이유가 붙으면 bare-na가 아니다", () => {
    const markdown = VALID_SPEC.replace(
      "| 권한 없음 | 해당 없음 — 이 화면은 권한 구분이 없다 | |",
      "| 권한 없음 | 해당 없음 — 로그인만 하면 누구나 본다 | |",
    );

    expect(specGridViolations(markdown)).toEqual([]);
  });

  it("AC 칸이 존재하지 않는 AC를 가리키면 unknown-ac 위반이다", () => {
    const markdown = VALID_SPEC.replace(
      "| 경계 | 최대 개수 안내 | AC-02 |",
      "| 경계 | 최대 개수 안내 | AC-99 |",
    );

    expect(specGridViolations(markdown)).toEqual([
      { type: "unknown-ac", state: "경계", ac: "AC-99" },
    ]);
  });

  it("해당 없음 줄은 AC 칸이 비어도 unknown-ac가 아니다", () => {
    expect(
      specGridViolations(VALID_SPEC).some((v) => v.type === "unknown-ac"),
    ).toBe(false);
  });

  it("무엇이 뜨나는 찼는데 AC 칸이 비면 missing-ac 위반이다", () => {
    const markdown = VALID_SPEC.replace(
      "| 로딩 | 스켈레톤 | AC-01 |",
      "| 로딩 | 스켈레톤 | |",
    );

    expect(specGridViolations(markdown)).toEqual([
      { type: "missing-ac", state: "로딩" },
    ]);
  });

  it("해당 없음 — 이유 줄은 AC 칸이 비어도 missing-ac가 아니다", () => {
    expect(
      specGridViolations(VALID_SPEC).some((v) => v.type === "missing-ac"),
    ).toBe(false);
  });

  it("AC마다 검증 층 불릿이 없으면 missing-verification-layer 위반이다", () => {
    const markdown = VALID_SPEC.replace(
      "- 검증 층: integration — 서버 응답을 확인해야 한다\n",
      "",
    );

    expect(specGridViolations(markdown)).toEqual([
      { type: "missing-verification-layer", ac: "AC-02" },
    ]);
  });

  it("서로 다른 두 위반이 동시에 있으면 둘 다 목록에 잡힌다", () => {
    const markdown = VALID_SPEC.replace(
      "| 재진입 | 캐시된 값을 먼저 보여준다 | AC-02 |\n",
      "",
    ).replace(
      "| 경계 | 최대 개수 안내 | AC-02 |",
      "| 경계 | 최대 개수 안내 | AC-99 |",
    );

    const violations = specGridViolations(markdown);

    expect(violations).toContainEqual({ type: "missing-row", state: "재진입" });
    expect(violations).toContainEqual({
      type: "unknown-ac",
      state: "경계",
      ac: "AC-99",
    });
    expect(violations).toHaveLength(2);
  });
});

describe("spec 대상 필터링 — status: approved는 검사 밖이다", () => {
  it("approved 문서는 상태 격자가 없어도 목록에 없다", () => {
    const root = tempRoot();
    write(
      root,
      "docs/2-design/spec/alpha.md",
      `---\nstatus: approved\n---\n\n# 지어낸 기능\n\n## 완료 조건\n### AC-01\n\n- 전제: x\n`,
    );
    write(root, "docs/2-design/spec/beta.md", VALID_SPEC);

    const files = repositorySpecGridDocs(root).map((doc) => doc.file);

    expect(files).not.toContain("docs/2-design/spec/alpha.md");
    expect(files).toContain("docs/2-design/spec/beta.md");
  });

  it("draft 문서는 위반이 있으면 목록에 그 위반이 든다", () => {
    const root = tempRoot();
    write(root, "docs/2-design/spec/gamma.md", withoutGridSection(VALID_SPEC));

    const gamma = repositorySpecGridDocs(root).find(
      (doc) => doc.file === "docs/2-design/spec/gamma.md",
    );

    expect(gamma?.violations).toEqual([{ type: "missing-section" }]);
  });
});

describe("spec 상태 격자 대조 — 실제 저장소 회귀", () => {
  it("검사가 실제 spec 문서를 훑는다", () => {
    expect(repositorySpecGridDocs().length).toBeGreaterThan(0);
  });

  it("승인 전 spec 전부가 상태 격자를 든다", () => {
    const broken = repositorySpecGridDocs()
      .filter((doc) => doc.violations.length > 0)
      .map((doc) => ({ file: doc.file, violations: doc.violations }));

    expect(broken).toEqual([]);
  });
});
