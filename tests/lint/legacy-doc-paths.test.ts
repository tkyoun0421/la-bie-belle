import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { legacyPathViolations } from "@tests/lint/legacy-doc-paths";

const ADR_004_RELATIVE = "docs/2-design/adr/ADR-004-domain-rules-home.md";

function tempRoot() {
  return mkdtempSync(join(tmpdir(), "legacy-doc-paths-"));
}

function write(root: string, relative: string, body: string) {
  const absolute = join(root, relative);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, body);
}

function violatingFiles(root: string) {
  return legacyPathViolations(root).map((violation) => violation.file);
}

function patternsFor(root: string, file: string) {
  return legacyPathViolations(root)
    .filter((violation) => violation.file === file)
    .map((violation) => violation.pattern);
}

describe("구 경로 잔존 검사", () => {
  it.each([
    ["docs/plan.md", "옛 계획 문서였던 docs/plan.md를 아직 참고한다."],
    ["docs/prd.md", "옛 PRD였던 docs/prd.md를 아직 참고한다."],
    ["docs/domain", "옛 도메인 문서였던 docs/domain을 아직 참고한다."],
    ["docs/adr/", "옛 ADR 자리였던 docs/adr/를 아직 참고한다."],
    ["docs/spec/", "옛 spec 자리였던 docs/spec/를 아직 참고한다."],
    [
      "docs/design-system/",
      "옛 디자인 시스템 자리였던 docs/design-system/를 아직 참고한다.",
    ],
  ])("옛 경로 %s가 남아 있으면 검출한다", (pattern, sentence) => {
    const root = tempRoot();
    write(root, "docs/1-plan/prd.md", `# PRD\n\n${sentence}\n`);

    expect(patternsFor(root, "docs/1-plan/prd.md")).toContain(pattern);
  });

  it("새 경로(docs/2-design/adr/ 등)는 옛 경로와 접두가 겹쳐도 오탐하지 않는다", () => {
    const root = tempRoot();
    write(
      root,
      "docs/1-plan/prd.md",
      "# PRD\n\n근거는 `docs/2-design/adr/ADR-005-sdlc-stage-folders-and-artifact-chain.md`에 있다.\n",
    );

    expect(violatingFiles(root)).toEqual([]);
  });

  it("docs/log/ 아래의 옛 경로 언급은 예외라 잡지 않는다", () => {
    const root = tempRoot();
    write(
      root,
      "docs/log/2026-09-04.md",
      "# 회차\n\n이번에 `docs/plan.md`를 `docs/backlog.md`로 옮겼다.\n",
    );

    expect(violatingFiles(root)).toEqual([]);
  });

  it("ADR-004의 결정 문장은 허용하되 같은 파일의 다른 옛 경로 언급은 잡는다", () => {
    const root = tempRoot();
    const realAdr004 = readFileSync(
      join(process.cwd(), ADR_004_RELATIVE),
      "utf8",
    );
    const withExtraViolation = `${realAdr004}\n\n## 덧붙임(픽스처)\n\n이 절은 실제 ADR-004에 없다. \`docs/design-system/README.md\`가 아직 옛 자리를 가리킨다는 뜻으로 지어낸 문장이다.\n`;
    write(root, ADR_004_RELATIVE, withExtraViolation);

    const patterns = patternsFor(root, ADR_004_RELATIVE);

    expect(patterns).not.toContain("docs/domain");
    expect(patterns).toContain("docs/design-system/");
  });

  it.each([
    [".claude/agents/test-planner.md", "정의문에 `docs/plan.md`가 남아 있다."],
    [".claude/skills/worktree/SKILL.md", "스킬 문서가 `docs/adr/`를 가리킨다."],
    ["src/entities/cart/model/price.ts", "// docs/spec/cart-price.md 참고"],
    [
      "scripts/generate-globals-css.mts",
      "// docs/design-system/tokens.md 참고",
    ],
  ])("검사 대상에 %s 같은 정의문·코드 파일도 포함된다", (relative, body) => {
    const root = tempRoot();
    write(root, relative, `${body}\n`);

    expect(violatingFiles(root)).toContain(relative);
  });
});
