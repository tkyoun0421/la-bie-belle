import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  ALLOWED_LINES,
  legacyPathViolations,
  staleAllowedLines,
} from "@tests/lint/legacyDocPaths";

const ADR_004_RELATIVE = "docs/2-design/adr/ADR-004-domain-rules-home.md";
const SDLC_GATE_RELATIVE = "docs/3-build/plans/sdlc-gate.md";

function legacyPath(...parts: string[]): string {
  return parts.join("");
}

const OLD_PLAN = legacyPath("docs/", "plan.md");
const OLD_PRD = legacyPath("docs/", "prd.md");
const OLD_DOMAIN = legacyPath("docs/", "domain");
const OLD_ADR = legacyPath("docs/", "adr/");
const OLD_SPEC = legacyPath("docs/", "spec/");
const OLD_DESIGN_SYSTEM = legacyPath("docs/", "design-system/");
const OLD_DESIGN_DOMAIN = legacyPath("docs/2-design/", "domain/");
const OLD_ARCHITECTURE = legacyPath("docs/2-design/", "architecture/");
const OLD_PAGES = legacyPath("docs/2-design/", "design-system/pages/");

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
  [
    OLD_DESIGN_DOMAIN,
    `옛 도메인 자리였던 ${OLD_DESIGN_DOMAIN}를 아직 참고한다.`,
  ],
  [
    OLD_ARCHITECTURE,
    `옛 구조 설계 자리였던 ${OLD_ARCHITECTURE}를 아직 참고한다.`,
  ],
  [OLD_PAGES, `옛 페이지 문서 자리였던 ${OLD_PAGES}를 아직 참고한다.`],
];

const RENAMED_SCRIPTS: [string, string][] = [
  [legacyPath("check-moved-lines", ".mts"), "scripts/checkMovedLines.mts"],
  [
    legacyPath("check-sources-impact", ".mts"),
    "scripts/checkSourcesImpact.mts",
  ],
  [legacyPath("e2e-seed-server", ".mts"), "scripts/e2eSeedServer.mts"],
  [legacyPath("font-subset", ".mts"), "scripts/fontSubset.mts"],
  [
    legacyPath("generate-database-types", ".mts"),
    "scripts/generateDatabaseTypes.mts",
  ],
  [
    legacyPath("generate-globals-css", ".mts"),
    "scripts/generateGlobalsCss.mts",
  ],
  [
    legacyPath("generate-route-types", ".mts"),
    "scripts/generateRouteTypes.mts",
  ],
  [legacyPath("inline-sian-font", ".mts"), "scripts/inlineSianFont.mts"],
  [legacyPath("module-alias-hooks", ".mjs"), "scripts/moduleAliasHooks.mjs"],
  [legacyPath("sync-edge-shared", ".mts"), "scripts/syncEdgeShared.mts"],
  [legacyPath("tokens-md", ".mts"), "scripts/tokensMd.mts"],
  [legacyPath("tossface-fetch", ".mts"), "scripts/tossfaceFetch.mts"],
  [legacyPath("seed-session", ".js"), "tests/e2e/scripts/seedSession.js"],
];

const RENAMED_LINT_FILES: [string, string][] = [
  [
    legacyPath("generate-globals-css", ".test.ts"),
    "tests/lint/generateGlobalsCss.test.ts",
  ],
  [legacyPath("legacy-doc-paths", ".ts"), "tests/lint/legacyDocPaths.ts"],
  [legacyPath("rule-check", ".ts"), "tests/lint/ruleCheck.ts"],
  [
    legacyPath("dark-media-query-compiles", ".test.ts"),
    "tests/lint/darkMediaQueryCompiles.test.ts",
  ],
];

const RENAMED_SOURCES: [string, string][] = [
  [
    legacyPath("src/shared/api/", "errorCodes.ts"),
    "src/shared/consts/error.const.ts",
  ],
  [
    legacyPath("src/screens/schedule-admin/model/", "holiday-switch.ts"),
    "src/entities/payroll/model/holidaySwitch.policy.ts",
  ],
  [
    legacyPath("src/features/schedule/model/", "useMyAvailability.ts"),
    "src/entities/availability/services/useMyAvailabilityQuery.ts",
  ],
  [
    legacyPath("src/screens/admin-home/ui/", "AdminHomeScreen.tsx"),
    "src/screens/adminHome/ui/AdminHomeScreen.tsx",
  ],
];

const NAMES_INSIDE_OTHER_WORDS = [
  legacyPath("design-", "tokens-md", ".mts"),
  legacyPath("seed-session", ".json"),
  legacyPath("my", "font-subset", ".mts"),
  legacyPath("doc-links", ".tsx"),
];

const RISK_14_CASES: [string, string][] = [
  [".claude/agents/test-planner.md", `정의문에 \`${OLD_PLAN}\`가 남아 있다.`],
  [
    ".claude/skills/worktree/SKILL.md",
    `스킬 문서가 \`${OLD_ADR}\`를 가리킨다.`,
  ],
  ["src/entities/cart/model/price.ts", `// ${OLD_SPEC}cart-price.md 참고`],
  ["scripts/generateGlobalsCss.mts", `// ${OLD_DESIGN_SYSTEM}tokens.md 참고`],
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

  it("옛 경로를 당시 기록으로 든 문서의 허용 줄은 그 파일에서만 통한다", () => {
    const root = tempRoot();
    const sentence = `**수정 대상.** \`${OLD_ARCHITECTURE}flows/README.md\`를 고친다.`;
    write(root, "docs/proposals/docs-structure-followup.md", `${sentence}\n`);
    write(root, "docs/proposals/other.md", `${sentence}\n`);

    expect(violatingFiles(root)).toEqual(["docs/proposals/other.md"]);
  });

  function patternsInSample(line: string): string[] {
    const root = tempRoot();
    write(root, "docs/3-build/plans/sample.md", `${line}\n`);

    return violationsFor(root, "docs/3-build/plans/sample.md").map(
      (violation) => violation.pattern,
    );
  }

  it.each(RENAMED_SCRIPTS)(
    "camelCase로 옮기기 전 스크립트 경로 scripts/%s가 남아 있으면 검출한다",
    (oldName) => {
      expect(
        patternsInSample(`| \`scripts/${oldName}\` | 시드 상태 | AC-01 |`),
      ).toContain(oldName);
    },
  );

  it.each(RENAMED_SCRIPTS)(
    "경로 없이 이름만 적힌 옛 스크립트 %s도 검출한다",
    (oldName) => {
      expect(
        patternsInSample(`\`${oldName}\`가 토큰 표를 읽어 CSS를 만든다.`),
      ).toContain(oldName);
    },
  );

  it.each(RENAMED_LINT_FILES)(
    "camelCase로 옮기기 전 tests/lint 파일 이름 %s를 경로가 있든 없든 검출한다",
    (oldName) => {
      expect(
        patternsInSample(`검사는 \`tests/lint/${oldName}\`가 한다.`),
      ).toEqual([oldName]);
      expect(patternsInSample(`검사는 ${oldName}가 한다.`)).toEqual([oldName]);
    },
  );

  it.each(NAMES_INSIDE_OTHER_WORDS)(
    "옛 이름이 다른 낱말 %s 안에 들어 있으면 잡지 않는다",
    (word) => {
      expect(patternsInSample(`\`${word}\`는 다른 파일이다.`)).toEqual([]);
    },
  );

  it("옮긴 뒤의 스크립트·검사 파일 이름은 잡지 않는다", () => {
    const root = tempRoot();
    const table = [...RENAMED_SCRIPTS, ...RENAMED_LINT_FILES]
      .map(([, currentPath]) => `| \`${currentPath}\` | 시드 상태 | AC-01 |`)
      .join("\n");
    write(root, "docs/3-build/plans/sample.md", `${table}\n`);

    expect(violatingFiles(root)).toEqual([]);
  });

  it.each(RENAMED_SOURCES)(
    "개명 기록에서 사라진 src 경로 %s가 남아 있으면 검출한다",
    (oldPath) => {
      expect(patternsInSample(`| \`${oldPath}\` | 판정 | AC-01 |`)).toEqual([
        oldPath,
      ]);
      expect(
        patternsInSample(`[근거](../../../${oldPath})가 그 자리다.`),
      ).toEqual([oldPath]);
    },
  );

  it.each(RENAMED_SOURCES)(
    "사라진 src 경로 %s가 더 긴 이름의 일부면 잡지 않는다",
    (oldPath) => {
      expect(patternsInSample(`\`${oldPath}x\`는 다른 파일이다.`)).toEqual([]);
    },
  );

  it("코드 파일 안의 사라진 src 경로는 픽스처라 잡지 않고, 같은 글이 YAML 주석이면 잡는다", () => {
    const root = tempRoot();
    const [oldPath] = RENAMED_SOURCES[0];
    write(root, "tests/lint/sample.test.ts", `const file = "${oldPath}";\n`);
    write(root, "tests/e2e/sample.yaml", `# \`${oldPath}\`가 전례다.\n`);

    expect(violatingFiles(root)).toEqual(["tests/e2e/sample.yaml"]);
  });

  it("개명된 src 경로의 지금 이름은 잡지 않는다", () => {
    const root = tempRoot();
    const table = RENAMED_SOURCES.map(
      ([, currentPath]) => `| \`${currentPath}\` | 판정 | AC-01 |`,
    ).join("\n");
    write(root, "docs/3-build/plans/sample.md", `${table}\n`);

    expect(violatingFiles(root)).toEqual([]);
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

describe("허용 항목의 낡음", () => {
  const TARGET = "docs/backlog.md";

  function rootWithRealAllowedFiles() {
    const root = tempRoot();
    for (const { file } of ALLOWED_LINES) {
      write(root, file, readFileSync(join(process.cwd(), file), "utf8"));
    }
    return root;
  }

  function staleFiles(root: string) {
    return staleAllowedLines(root).map((allowed) => allowed.file);
  }

  it("덮어쓰는 handoff는 허용 목록에 오르지 않는다", () => {
    expect(ALLOWED_LINES.map((allowed) => allowed.file)).not.toContain(
      "docs/handoff.md",
    );
  });

  it("허용 줄이 다 제자리에 있으면 낡은 항목이 없다", () => {
    expect(staleAllowedLines(rootWithRealAllowedFiles())).toEqual([]);
  });

  it("문서가 고쳐져 표지 문장이 사라지면 그 항목이 낡았다고 드러난다", () => {
    const root = rootWithRealAllowedFiles();
    write(root, TARGET, "# 인계\n\n다음 첫 수는 새 task다.\n");

    const stale = staleFiles(root);

    expect(stale.length).toBeGreaterThan(0);
    expect(new Set(stale)).toEqual(new Set([TARGET]));
  });

  it("표지 문장은 남았는데 그 줄의 옛 경로가 고쳐졌으면 낡았다", () => {
    const root = rootWithRealAllowedFiles();
    const targetMarkers = ALLOWED_LINES.filter(
      (allowed) => allowed.file === TARGET,
    ).map((allowed) => allowed.marker);
    write(
      root,
      TARGET,
      `${targetMarkers.map((marker) => `${marker}는 이제 지금 경로만 든다.`).join("\n")}\n`,
    );

    expect(new Set(staleFiles(root))).toEqual(new Set([TARGET]));
  });

  it("허용 항목의 파일이 없어도 낡았다", () => {
    const root = rootWithRealAllowedFiles();
    rmSync(join(root, TARGET));

    expect(new Set(staleFiles(root))).toEqual(new Set([TARGET]));
  });
});

describe("구 경로 잔존 검사 — 실제 저장소 회귀", () => {
  it("허용된 자리(ADR-004 결정 문장, sdlc-gate.md 패턴 열거 줄 등) 말고는 옛 경로가 안 남아 있다", () => {
    const violations = legacyPathViolations(process.cwd());

    expect(violations).toEqual([]);
  });

  it("허용 항목마다 그 표지 문장이 옛 경로가 남은 줄을 실제로 가리킨다", () => {
    expect(staleAllowedLines(process.cwd())).toEqual([]);
  });
});
