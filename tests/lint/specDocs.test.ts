import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { sourceDocs } from "@tests/lint/spec-docs";

const COMPLETION_SENTENCE = "완료된 작업의 당시 계획이다";

function tempRoot() {
  return mkdtempSync(join(tmpdir(), "spec-docs-"));
}

function write(root: string, relative: string, body: string) {
  const absolute = join(root, relative);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, body);
}

function trackedOf(root: string, file: string): boolean | undefined {
  return sourceDocs(root).find((doc) => doc.file === file)?.tracked;
}

describe("spec·plan의 tracked 판정", () => {
  it("status가 approved인 spec은 tracked다", () => {
    const root = tempRoot();
    write(
      root,
      "docs/2-design/spec/alpha.md",
      `---\nstatus: approved\nsources:\n  - ../modules/attendance/README.md\n---\n\n# 지어낸 기능\n`,
    );

    expect(trackedOf(root, "docs/2-design/spec/alpha.md")).toBe(true);
  });

  it("status가 draft인 spec은 tracked가 아니다", () => {
    const root = tempRoot();
    write(
      root,
      "docs/2-design/spec/beta.md",
      `---\nstatus: draft\nsources:\n  - ../modules/attendance/README.md\n---\n\n# 지어낸 기능\n`,
    );

    expect(trackedOf(root, "docs/2-design/spec/beta.md")).toBe(false);
  });

  it("완료 머리글이 없는 plan은 tracked다", () => {
    const root = tempRoot();
    write(
      root,
      "docs/3-build/plans/gamma.md",
      `# 살아 있는 계획\n\n아직 진행 중이다.\n`,
    );

    expect(trackedOf(root, "docs/3-build/plans/gamma.md")).toBe(true);
  });

  it("완료 머리글이 있는 plan은 tracked가 아니다", () => {
    const root = tempRoot();
    write(
      root,
      "docs/3-build/plans/delta.md",
      `# 끝난 계획\n\n> ${COMPLETION_SENTENCE}. 현재 규칙은 링크된 정본을 따른다 — 완료 기록: [log/2026-01-01.md](../../log/2026-01-01.md)\n\n본문이다.\n`,
    );

    expect(trackedOf(root, "docs/3-build/plans/delta.md")).toBe(false);
  });

  it("frontmatter를 든 plan도 완료 머리글이 있으면 tracked가 아니다", () => {
    const root = tempRoot();
    write(
      root,
      "docs/3-build/plans/epsilon.md",
      `---\nsources:\n  - ../../2-design/modules/attendance/README.md\n---\n\n# 끝난 계획\n\n> ${COMPLETION_SENTENCE}. 현재 규칙은 링크된 정본을 따른다 — 완료 기록: [log/2026-01-01.md](../../log/2026-01-01.md)\n\n본문이다.\n`,
    );

    expect(trackedOf(root, "docs/3-build/plans/epsilon.md")).toBe(false);
  });

  it("본문 중간에 같은 문장이 나오는 것으로는 완료가 아니다", () => {
    const root = tempRoot();
    write(
      root,
      "docs/3-build/plans/zeta.md",
      `# 살아 있는 계획\n\n지금도 진행 중이다.\n\n## 회고\n\n예전 다른 문서에서 "${COMPLETION_SENTENCE}"라는 문장을 인용한 적이 있다.\n`,
    );

    expect(trackedOf(root, "docs/3-build/plans/zeta.md")).toBe(true);
  });
});

describe("정본 추적이 살아 있는지 (회귀)", () => {
  it("docs/3-build/plans/ 아래에 tracked인 문서가 하나 이상이다", () => {
    const trackedPlans = sourceDocs().filter(
      (doc) => doc.file.startsWith("docs/3-build/plans/") && doc.tracked,
    );

    expect(trackedPlans.length).toBeGreaterThan(0);
  });

  it("sources를 든 문서 전체가 통째로 걷혀 나가지 않는다", () => {
    const withSources = sourceDocs().filter((doc) => doc.sources.length > 0);
    const trackedCount = withSources.filter((doc) => doc.tracked).length;

    expect(trackedCount).toBeGreaterThan(0);
  });
});
