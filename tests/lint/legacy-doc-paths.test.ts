import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { legacyPathViolations } from "@tests/lint/legacy-doc-paths";

const ADR_004_RELATIVE = "docs/2-design/adr/ADR-004-domain-rules-home.md";
const SDLC_GATE_RELATIVE = "docs/2-design/spec/sdlc-gate.md";

function legacyPath(...parts: string[]): string {
  return parts.join("");
}

const OLD_PLAN = legacyPath("docs/", "plan.md");
const OLD_PRD = legacyPath("docs/", "prd.md");
const OLD_DOMAIN = legacyPath("docs/", "domain");
const OLD_ADR = legacyPath("docs/", "adr/");
const OLD_SPEC = legacyPath("docs/", "spec/");
const OLD_DESIGN_SYSTEM = legacyPath("docs/", "design-system/");

const RISK_10_CASES: [string, string][] = [
  [OLD_PLAN, `옛 계획 문서였던 ${OLD_PLAN}를 아직 참고한다.`],
  [OLD_PRD, `옛 PRD였던 ${OLD_PRD}를 아직 참고한다.`],
  [OLD_DOMAIN, `옛 도메인 문서였던 ${OLD_DOMAIN}을 아직 참고한다.`],
  [OLD_ADR, `옛 ADR 자리였던 ${OLD_ADR}를 아직 참고한다.`],
  [OLD_SPEC, `옛 spec 자리였던 ${OLD_SPEC}를 아직 참고한다.`],
  [
    OLD_DESIGN_SYSTEM,
    `옛 디자인 시스템 자리였던 ${OLD_DESIGN_SYSTEM}를 아직 참고한다.`,
  ],
];

const RISK_14_CASES: [string, string][] = [
  [".claude/agents/test-planner.md", `정의문에 \`${OLD_PLAN}\`가 남아 있다.`],
  [
    ".claude/skills/worktree/SKILL.md",
    `스킬 문서가 \`${OLD_ADR}\`를 가리킨다.`,
  ],
  ["src/entities/cart/model/price.ts", `// ${OLD_SPEC}cart-price.md 참고`],
  ["scripts/generate-globals-css.mts", `// ${OLD_DESIGN_SYSTEM}tokens.md 참고`],
];

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

function violationsFor(root: string, file: string) {
  return legacyPathViolations(root).filter(
    (violation) => violation.file === file,
  );
}

function lineNumberContaining(content: string, needle: string): number {
  const index = content.split("\n").findIndex((line) => line.includes(needle));
  if (index === -1) {
    throw new Error(`"${needle}"을 담은 줄을 찾지 못했다.`);
  }
  return index + 1;
}

describe("구 경로 잔존 검사", () => {
  it.each(RISK_10_CASES)(
    "옛 경로 %s가 남아 있으면 검출한다",
    (pattern, sentence) => {
      const root = tempRoot();
      write(root, "docs/1-plan/prd.md", `# PRD\n\n${sentence}\n`);

      const patterns = violationsFor(root, "docs/1-plan/prd.md").map(
        (violation) => violation.pattern,
      );

      expect(patterns).toContain(pattern);
    },
  );

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
      `# 회차\n\n이번에 \`${OLD_PLAN}\`를 \`docs/backlog.md\`로 옮겼다.\n`,
    );

    expect(violatingFiles(root)).toEqual([]);
  });

  it("ADR-004의 결정 문장은 허용하되 같은 파일의 다른 옛 경로 언급은 잡는다", () => {
    const root = tempRoot();
    const realAdr004 = readFileSync(
      join(process.cwd(), ADR_004_RELATIVE),
      "utf8",
    );
    const allowedLineNumber = lineNumberContaining(
      realAdr004,
      legacyPath("`docs/", "domain.md` 한 파일을"),
    );
    const withExtraViolation = `${realAdr004}\n이 줄은 실제 ADR-004에 없다. \`${OLD_DESIGN_SYSTEM}README.md\`가 아직 옛 자리를 가리킨다는 뜻으로 지어낸 문장이다.\n`;
    write(root, ADR_004_RELATIVE, withExtraViolation);

    const violations = violationsFor(root, ADR_004_RELATIVE);
    const violationLines = violations.map((violation) => violation.line);

    expect(violationLines).not.toContain(allowedLineNumber);
    expect(violations.map((violation) => violation.pattern)).toContain(
      OLD_DESIGN_SYSTEM,
    );
  });

  it("sdlc-gate.md의 패턴 열거 줄은 허용하되 같은 파일의 다른 옛 경로 언급은 잡는다", () => {
    const root = tempRoot();
    const realSdlcGate = readFileSync(
      join(process.cwd(), SDLC_GATE_RELATIVE),
      "utf8",
    );
    const allowedLineNumber = lineNumberContaining(
      realSdlcGate,
      "옮기기 전 경로",
    );
    const withExtraViolation = `${realSdlcGate}\n이 줄은 실제 sdlc-gate.md에 없다. \`${OLD_PLAN}\`를 아직 참고한다는 뜻으로 지어낸 문장이다.\n`;
    write(root, SDLC_GATE_RELATIVE, withExtraViolation);

    const violations = violationsFor(root, SDLC_GATE_RELATIVE);
    const violationLines = violations.map((violation) => violation.line);

    expect(violationLines).not.toContain(allowedLineNumber);
    expect(violations.map((violation) => violation.pattern)).toContain(
      OLD_PLAN,
    );
  });

  it.each(RISK_14_CASES)(
    "검사 대상에 %s 같은 정의문·코드 파일도 포함된다",
    (relative, body) => {
      const root = tempRoot();
      write(root, relative, `${body}\n`);

      expect(violatingFiles(root)).toContain(relative);
    },
  );
});

describe("구 경로 잔존 검사 — 실제 저장소 회귀", () => {
  it("허용된 두 자리(ADR-004 결정 문장, sdlc-gate.md 패턴 열거 줄) 말고는 옛 경로가 안 남아 있다", () => {
    const violations = legacyPathViolations(process.cwd());

    expect(violations).toEqual([]);
  });
});
