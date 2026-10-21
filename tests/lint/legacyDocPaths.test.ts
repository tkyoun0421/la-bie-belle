import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import {
  ALLOWED_LINES,
  legacyPathViolations,
  pathsMovedAway,
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
  [
    legacyPath("scripts/check-moved-lines", ".mts"),
    "scripts/checkMovedLines.mts",
  ],
  [
    legacyPath("scripts/check-sources-impact", ".mts"),
    "scripts/checkSourcesImpact.mts",
  ],
  [legacyPath("scripts/e2e-seed-server", ".mts"), "scripts/e2eSeedServer.mts"],
  [legacyPath("scripts/font-subset", ".mts"), "scripts/fontSubset.mts"],
  [
    legacyPath("scripts/generate-database-types", ".mts"),
    "scripts/generateDatabaseTypes.mts",
  ],
  [
    legacyPath("scripts/generate-globals-css", ".mts"),
    "scripts/generateGlobalsCss.mts",
  ],
  [
    legacyPath("scripts/generate-route-types", ".mts"),
    "scripts/generateRouteTypes.mts",
  ],
  [
    legacyPath("scripts/inline-sian-font", ".mts"),
    "scripts/inlineSianFont.mts",
  ],
  [
    legacyPath("scripts/module-alias-hooks", ".mjs"),
    "scripts/moduleAliasHooks.mjs",
  ],
  [
    legacyPath("scripts/sync-edge-shared", ".mts"),
    "scripts/syncEdgeShared.mts",
  ],
  [legacyPath("scripts/tokens-md", ".mts"), "scripts/tokensMd.mts"],
  [legacyPath("scripts/tossface-fetch", ".mts"), "scripts/tossfaceFetch.mts"],
  [
    legacyPath("tests/e2e/scripts/seed-session", ".js"),
    "tests/e2e/scripts/seedSession.js",
  ],
];

const RENAMED_LINT_FILES: [string, string][] = [
  [
    legacyPath("tests/lint/generate-globals-css", ".test.ts"),
    "tests/lint/generateGlobalsCss.test.ts",
  ],
  [
    legacyPath("tests/lint/legacy-doc-paths", ".ts"),
    "tests/lint/legacyDocPaths.ts",
  ],
  [legacyPath("tests/lint/rule-check", ".ts"), "tests/lint/ruleCheck.ts"],
  [
    legacyPath("tests/lint/dark-media-query-compiles", ".test.ts"),
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

function withoutSourceRoot(sourcePath: string): string {
  return sourcePath.replace(/^src\//, "");
}

const LAYER_RELATIVE_SOURCES: [string, string][] = RENAMED_SOURCES.map(
  ([oldPath, currentPath]) => [
    withoutSourceRoot(oldPath),
    withoutSourceRoot(currentPath),
  ],
);

const OTHER_FOLDER_PREFIXES = [
  "tests/",
  "eslint-rules/",
  "other-repo/",
  "../other-repo/",
  "x",
];

const RENAMED_AWAY = [
  ...RENAMED_SCRIPTS,
  ...RENAMED_LINT_FILES,
  ...RENAMED_SOURCES,
].map(([oldPath]) => oldPath);

const SIBLING_FOLDER = "src/screens/sample/ui/";
const OLD_DAY_SHEET = "OldDaySheet.tsx";
const OLD_FORM_SHEET = "OldFormSheet.tsx";
const SIBLINGS_RENAMED_AWAY = [
  `${SIBLING_FOLDER}${OLD_DAY_SHEET}`,
  `${SIBLING_FOLDER}${OLD_FORM_SHEET}`,
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

function violatingFiles(root: string, renamedAway = RENAMED_AWAY) {
  return legacyPathViolations(root, renamedAway).map(
    (violation) => violation.file,
  );
}

function violationsFor(root: string, file: string) {
  return legacyPathViolations(root, RENAMED_AWAY).filter(
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

  function patternsInSample(
    line: string,
    renamedAway = RENAMED_AWAY,
    file = "docs/3-build/plans/sample.md",
  ): string[] {
    const root = tempRoot();
    write(root, file, `${line}\n`);

    return legacyPathViolations(root, renamedAway)
      .filter((violation) => violation.file === file)
      .map((violation) => violation.pattern);
  }

  it.each(RENAMED_SCRIPTS)(
    "camelCase로 옮기기 전 스크립트 경로 %s가 남아 있으면 검출한다",
    (oldPath) => {
      expect(
        patternsInSample(`| \`${oldPath}\` | 시드 상태 | AC-01 |`),
      ).toContain(basename(oldPath));
    },
  );

  it.each(RENAMED_SCRIPTS)(
    "경로 없이 이름만 적힌 옛 스크립트 %s도 검출한다",
    (oldPath) => {
      const oldName = basename(oldPath);

      expect(
        patternsInSample(`\`${oldName}\`가 토큰 표를 읽어 CSS를 만든다.`),
      ).toContain(oldName);
    },
  );

  it.each(RENAMED_LINT_FILES)(
    "camelCase로 옮기기 전 tests/lint 파일 %s를 경로가 있든 없든 검출한다",
    (oldPath) => {
      const oldName = basename(oldPath);

      expect(patternsInSample(`검사는 \`${oldPath}\`가 한다.`)).toEqual([
        oldName,
      ]);
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

  it("이름 변경 기록의 옛 경로에 지금 파일이 다시 있으면 잡지 않는다", () => {
    const root = tempRoot();
    const recreated = "tests/lint/sampleTypes.ts";
    write(root, recreated, "export const sample = 1;\n");
    write(
      root,
      "docs/3-build/plans/sample.md",
      `검사는 \`${recreated}\`가 한다.\n`,
    );

    expect(violatingFiles(root, [recreated])).toEqual([]);
  });

  it("옛 파일 이름이 지금 다른 폴더에 있으면 이름만으로는 잡지 않고 옛 경로로만 잡는다", () => {
    const root = tempRoot();
    const oldPath = "tests/unit/sample.test.ts";
    write(root, "src/shared/utils/__tests__/sample.test.ts", "");
    write(
      root,
      "docs/3-build/plans/sample.md",
      `\`sample.test.ts\`가 그 테스트다.\n\`${oldPath}\`는 옮기기 전 자리다.\n`,
    );

    expect(legacyPathViolations(root, [oldPath])).toEqual([
      { file: "docs/3-build/plans/sample.md", pattern: oldPath, line: 2 },
    ]);
  });

  it("경로 뒤에 이어 쓴 형제 이름은 앞 경로의 폴더에서 읽어 옛 경로를 잡는다", () => {
    expect(
      patternsInSample(
        `\`${SIBLING_FOLDER}SampleScreen.tsx\`·\`${OLD_DAY_SHEET}\`·\`${OLD_FORM_SHEET}\`가 화면이다.`,
        SIBLINGS_RENAMED_AWAY,
      ),
    ).toEqual(SIBLINGS_RENAMED_AWAY);
  });

  it("형제 이름을 쉼표로 이어 써도 잡는다", () => {
    expect(
      patternsInSample(
        `\`${SIBLING_FOLDER}SampleScreen.tsx\`, \`${OLD_DAY_SHEET}\`가 화면이다.`,
        SIBLINGS_RENAMED_AWAY,
      ),
    ).toEqual([`${SIBLING_FOLDER}${OLD_DAY_SHEET}`]);
  });

  it("앞 경로가 옛 경로이고 형제 이름도 옛 경로면 둘 다 잡는다", () => {
    expect(
      patternsInSample(
        `\`${SIBLING_FOLDER}${OLD_FORM_SHEET}\`·\`${OLD_DAY_SHEET}\`가 시트다.`,
        SIBLINGS_RENAMED_AWAY,
      ),
    ).toEqual([
      `${SIBLING_FOLDER}${OLD_FORM_SHEET}`,
      `${SIBLING_FOLDER}${OLD_DAY_SHEET}`,
    ]);
  });

  it("형제 이름을 앞 경로의 폴더에서 읽은 경로가 옛 경로가 아니면 잡지 않는다", () => {
    expect(
      patternsInSample(
        `\`src/screens/other/ui/OtherScreen.tsx\`·\`${OLD_DAY_SHEET}\`가 화면이다.`,
        SIBLINGS_RENAMED_AWAY,
      ),
    ).toEqual([]);
  });

  it("앞 경로 없이 홀로 적힌 옛 src 파일 이름은 잡지 않는다", () => {
    expect(
      patternsInSample(
        `\`${OLD_DAY_SHEET}\`가 시트다. ${OLD_FORM_SHEET}도 그렇다.`,
        SIBLINGS_RENAMED_AWAY,
      ),
    ).toEqual([]);
  });

  it("코드 파일 안의 형제 이름은 잡지 않는다", () => {
    expect(
      patternsInSample(
        `const files = "\`${SIBLING_FOLDER}SampleScreen.tsx\`·\`${OLD_DAY_SHEET}\`";`,
        SIBLINGS_RENAMED_AWAY,
        "tests/lint/sample.test.ts",
      ),
    ).toEqual([]);
  });

  it.each(LAYER_RELATIVE_SOURCES)(
    "src 없이 층부터 적은 옛 경로 %s도 src를 붙여 읽어 잡는다",
    (layerPath) => {
      expect(patternsInSample(`| \`${layerPath}\` | 판정 | AC-01 |`)).toEqual([
        layerPath,
      ]);
      expect(patternsInSample(`${layerPath}가 그 자리다.`)).toEqual([
        layerPath,
      ]);
    },
  );

  it.each(LAYER_RELATIVE_SOURCES)(
    "층부터 적은 옛 경로 %s가 더 긴 이름의 일부면 잡지 않는다",
    (layerPath) => {
      expect(patternsInSample(`\`${layerPath}x\`는 다른 파일이다.`)).toEqual(
        [],
      );
    },
  );

  it("층부터 적은 지금 경로는 잡지 않는다", () => {
    const root = tempRoot();
    const table = LAYER_RELATIVE_SOURCES.map(
      ([, currentPath]) => `| \`${currentPath}\` | 판정 | AC-01 |`,
    ).join("\n");
    write(root, "docs/3-build/plans/sample.md", `${table}\n`);

    expect(violatingFiles(root)).toEqual([]);
  });

  it.each(OTHER_FOLDER_PREFIXES)(
    "층 경로 앞에 %s가 붙어 있으면 다른 자리라 잡지 않는다",
    (prefix) => {
      const [[layerPath]] = LAYER_RELATIVE_SOURCES;

      expect(
        patternsInSample(`\`${prefix}${layerPath}\`는 다른 자리다.`),
      ).toEqual([]);
    },
  );

  it.each([
    "app/old-globals.css",
    "app/old-favicon.ico",
    "shared/config/fonts/OldLicense.txt",
    "shared/config/fonts/OldSans.woff2",
    "shared/old-models/.gitkeep",
  ])("층부터 적은 옛 경로 %s는 .ts·.tsx가 아니어도 잡는다", (layerPath) => {
    expect(
      patternsInSample(`\`${layerPath}\`가 그 자리다.`, [`src/${layerPath}`]),
    ).toEqual([layerPath]);
  });

  it("층부터 적은 ts 밖 옛 경로에 지금 파일이 다시 있으면 잡지 않는다", () => {
    const root = tempRoot();
    write(root, "src/app/globals.css", "@import 'tailwindcss';\n");
    write(
      root,
      "docs/3-build/plans/sample.md",
      "`app/globals.css`가 토큰을 든다.\n",
    );

    expect(violatingFiles(root, ["src/app/globals.css"])).toEqual([]);
  });

  it("코드 파일 안의 층부터 적은 옛 경로는 잡지 않는다", () => {
    const [[layerPath]] = LAYER_RELATIVE_SOURCES;

    expect(
      patternsInSample(
        `const file = "${layerPath}";`,
        RENAMED_AWAY,
        "tests/lint/sample.test.ts",
      ),
    ).toEqual([]);
  });

  it("층부터 적은 경로 뒤에 이어 쓴 형제 이름도 src를 붙여 읽어 잡는다", () => {
    const layerFolder = withoutSourceRoot(SIBLING_FOLDER);

    expect(
      patternsInSample(
        `\`${layerFolder}SampleScreen.tsx\`·\`${OLD_DAY_SHEET}\`가 화면이다.`,
        SIBLINGS_RENAMED_AWAY,
      ),
    ).toEqual([`${layerFolder}${OLD_DAY_SHEET}`]);
    expect(
      patternsInSample(
        `\`${layerFolder}${OLD_FORM_SHEET}\`·\`${OLD_DAY_SHEET}\`가 시트다.`,
        SIBLINGS_RENAMED_AWAY,
      ),
    ).toEqual([
      `${layerFolder}${OLD_FORM_SHEET}`,
      `${layerFolder}${OLD_DAY_SHEET}`,
    ]);
  });

  it("다른 폴더 아래 층 이름으로 시작하는 형제 이름은 잡지 않는다", () => {
    expect(
      patternsInSample(
        `\`tests/${withoutSourceRoot(SIBLING_FOLDER)}SampleScreen.tsx\`·\`${OLD_DAY_SHEET}\`가 화면이다.`,
        SIBLINGS_RENAMED_AWAY,
      ),
    ).toEqual([]);
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

const BACKLOG_COLUMNS = [
  "작업 ID",
  "작업",
  "상태",
  "선행 작업 ID",
  "spec 또는 plan",
  "검증·완료 근거",
];

function tableHead(): string {
  return `| ${BACKLOG_COLUMNS.join(" | ")} |\n| ${BACKLOG_COLUMNS.map(() => "---").join(" | ")} |`;
}

type BacklogLink = { id: string; status: string; plan: string };

function writeBacklog(root: string, links: BacklogLink[]) {
  write(
    root,
    "docs/README.md",
    `# docs\n\n## 협업 기록\n\n\`\`\`markdown\n${tableHead()}\n\`\`\`\n`,
  );
  const rows = links.map(
    ({ id, status, plan }) =>
      `| \`${id}\` | 지어낸 작업 | ${status} | — | [plan](${plan.replace(/^docs\//, "")}) | — |`,
  );
  write(
    root,
    "docs/backlog.md",
    `# backlog\n\n${tableHead()}\n${rows.join("\n")}\n`,
  );
}

describe("끝난 plan", () => {
  const PLAN = "docs/3-build/plans/sample-plan.md";
  const OLD_PATH_LINE = `그때는 \`${OLD_PLAN}\`가 계획 문서였다.`;

  function rootWithPlan(links: BacklogLink[]) {
    const root = tempRoot();
    write(root, PLAN, `# 계획\n\n${OLD_PATH_LINE}\n`);
    writeBacklog(root, links);
    return root;
  }

  it("링크하는 task가 모두 done이면 그 plan의 옛 경로는 잡지 않는다", () => {
    const root = rootWithPlan([
      { id: "alpha", status: "done", plan: PLAN },
      { id: "beta", status: "done", plan: PLAN },
    ]);

    expect(violatingFiles(root)).toEqual([]);
  });

  it.each(["active", "ready", "blocked", "candidate"])(
    "링크하는 task 하나가 %s면 done이 섞여 있어도 그 plan을 검사한다",
    (status) => {
      const root = rootWithPlan([
        { id: "alpha", status: "done", plan: PLAN },
        { id: "beta", status, plan: PLAN },
      ]);

      expect(violationsFor(root, PLAN)).toEqual([
        { file: PLAN, pattern: OLD_PLAN, line: 3 },
      ]);
    },
  );

  it("링크하는 task가 없는 plan은 검사한다", () => {
    const root = rootWithPlan([
      { id: "alpha", status: "done", plan: "docs/3-build/plans/other.md" },
    ]);

    expect(violatingFiles(root)).toEqual([PLAN]);
  });

  it("backlog가 없으면 모든 plan을 검사한다", () => {
    const root = tempRoot();
    write(root, PLAN, `# 계획\n\n${OLD_PATH_LINE}\n`);

    expect(violatingFiles(root)).toEqual([PLAN]);
  });

  it("done task가 링크해도 plan 밖의 문서는 검사한다", () => {
    const spec = "docs/2-design/spec/sample-plan.md";
    const proposal = "docs/proposals/sample-plan.md";
    const root = tempRoot();
    write(root, spec, `# spec\n\n${OLD_PATH_LINE}\n`);
    write(root, proposal, `# 제안\n\n${OLD_PATH_LINE}\n`);
    writeBacklog(root, [
      { id: "alpha", status: "done", plan: spec },
      { id: "beta", status: "done", plan: proposal },
    ]);

    expect(new Set(violatingFiles(root))).toEqual(new Set([spec, proposal]));
  });
});

describe("허용 항목의 낡음", () => {
  const TARGET = "docs/backlog.md";

  let renamedAway: string[];

  beforeAll(() => {
    renamedAway = pathsMovedAway(process.cwd());
  });

  function rootWithRealAllowedFiles() {
    const root = tempRoot();
    for (const { file } of ALLOWED_LINES) {
      write(root, file, readFileSync(join(process.cwd(), file), "utf8"));
    }
    return root;
  }

  function staleFiles(root: string) {
    return staleAllowedLines(root, renamedAway).map((allowed) => allowed.file);
  }

  it("덮어쓰는 handoff는 허용 목록에 오르지 않는다", () => {
    expect(ALLOWED_LINES.map((allowed) => allowed.file)).not.toContain(
      "docs/handoff.md",
    );
  });

  it("허용 줄이 다 제자리에 있으면 낡은 항목이 없다", () => {
    expect(staleAllowedLines(rootWithRealAllowedFiles(), renamedAway)).toEqual(
      [],
    );
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

  it("허용 항목의 plan을 링크한 task가 모두 done이 되면 그 항목이 낡았다고 드러난다", () => {
    const root = rootWithRealAllowedFiles();
    writeBacklog(root, [
      { id: "sdlc-gate", status: "done", plan: SDLC_GATE_RELATIVE },
    ]);

    expect(staleFiles(root)).toContain(SDLC_GATE_RELATIVE);
  });

  it("허용 항목의 plan을 링크한 task가 아직 done이 아니면 그 항목은 살아 있다", () => {
    const root = rootWithRealAllowedFiles();
    writeBacklog(root, [
      { id: "sdlc-gate", status: "active", plan: SDLC_GATE_RELATIVE },
    ]);

    expect(staleFiles(root)).not.toContain(SDLC_GATE_RELATIVE);
  });

  it("허용 항목의 파일이 없어도 낡았다", () => {
    const root = rootWithRealAllowedFiles();
    rmSync(join(root, TARGET));

    expect(new Set(staleFiles(root))).toEqual(new Set([TARGET]));
  });
});

describe("이름 변경 기록", () => {
  function git(cwd: string, ...args: string[]) {
    const result = spawnSync(
      "git",
      [
        "-c",
        "user.name=test",
        "-c",
        "user.email=test@example.com",
        "-c",
        "commit.gpgsign=false",
        ...args,
      ],
      { cwd, encoding: "utf8" },
    );
    if (result.status !== 0) {
      throw new Error(`git ${args.join(" ")} 실패: ${result.stderr}`);
    }
  }

  function commitAll(repo: string, message: string) {
    git(repo, "add", "--all");
    git(repo, "commit", "--quiet", "--no-verify", "-m", message);
  }

  function repoWithRenames() {
    const repo = tempRoot();
    git(repo, "init", "--quiet");
    write(repo, "src/old-name.ts", "export const sample = 1;\n");
    write(repo, "scripts/old-script.mts", "export const script = 1;\n");
    write(repo, "docs/old-doc.md", "# 문서\n\n본문이다.\n");
    commitAll(repo, "처음");
    git(repo, "mv", "src/old-name.ts", "src/newName.ts");
    git(repo, "mv", "scripts/old-script.mts", "scripts/oldScript.mts");
    git(repo, "mv", "docs/old-doc.md", "docs/new-doc.md");
    commitAll(repo, "이름을 바꾼다");

    return repo;
  }

  it("src·scripts·tests 아래 개명의 옛 경로를 뽑고 다른 자리의 개명은 뺀다", () => {
    expect(new Set(pathsMovedAway(repoWithRenames()))).toEqual(
      new Set(["src/old-name.ts", "scripts/old-script.mts"]),
    );
  });

  const REWRITTEN_BODY = [
    'import { View } from "react-native";',
    "",
    "type Props = { title: string; onClose: () => void };",
    "",
    "export function Rewritten({ title, onClose }: Props) {",
    "  return <View accessibilityLabel={title} onTouchEnd={onClose} />;",
    "}",
    "",
  ].join("\n");

  function repoWithLowSimilarityMoves() {
    const repo = tempRoot();
    git(repo, "init", "--quiet");
    write(repo, "src/ui/Removed.tsx", "export const removed = 1;\n");
    write(repo, "src/ui/OldSheet.tsx", "export const sheet = null;\n");
    write(repo, "src/ui/Restored.tsx", "export const restored = 1;\n");
    write(repo, "docs/moved-doc.md", "# 문서\n");
    commitAll(repo, "처음");
    rmSync(join(repo, "src/ui/Removed.tsx"));
    rmSync(join(repo, "src/ui/OldSheet.tsx"));
    write(repo, "src/screens/sample/ui/OldSheet.tsx", REWRITTEN_BODY);
    rmSync(join(repo, "src/ui/Restored.tsx"));
    write(repo, "src/screens/sample/ui/Restored.tsx", REWRITTEN_BODY);
    rmSync(join(repo, "docs/moved-doc.md"));
    write(repo, "docs/archive/moved-doc.md", REWRITTEN_BODY);
    commitAll(repo, "옮기며 다시 쓴다");
    write(repo, "src/ui/Restored.tsx", "export const restored = 2;\n");
    commitAll(repo, "같은 자리에 다시 만든다");

    return repo;
  }

  it("닮음이 낮아 삭제·생성으로 남은 이동은 같은 커밋에 같은 이름이 생겼으면 옛 경로로 뽑는다", () => {
    const movedAway = pathsMovedAway(repoWithLowSimilarityMoves());

    expect(movedAway).toEqual(
      expect.arrayContaining(["src/ui/OldSheet.tsx", "src/ui/Restored.tsx"]),
    );
    expect(movedAway).not.toContain("docs/moved-doc.md");
  });

  it("이어지는 파일 없이 지운 경로는 이동이 아니라 뽑지 않는다", () => {
    expect(pathsMovedAway(repoWithLowSimilarityMoves())).not.toContain(
      "src/ui/Removed.tsx",
    );
  });

  it("옮긴 뒤 옛 경로에 다시 만든 파일은 잡지 않고 지금 없는 옛 경로만 잡는다", () => {
    const repo = repoWithLowSimilarityMoves();
    write(
      repo,
      "docs/3-build/plans/sample.md",
      [
        "`src/ui/Restored.tsx`가 지금 자리다.",
        "`src/ui/OldSheet.tsx`가 옛 시트다.",
        "`src/ui/Removed.tsx`는 그때 지웠다.",
        "",
      ].join("\n"),
    );

    expect(legacyPathViolations(repo, pathsMovedAway(repo))).toEqual([
      {
        file: "docs/3-build/plans/sample.md",
        pattern: "src/ui/OldSheet.tsx",
        line: 2,
      },
    ]);
  });

  it("얕은 clone이면 이력이 없다고 알리고 실패한다", () => {
    const shallow = join(tempRoot(), "shallow");
    git(
      tmpdir(),
      "clone",
      "--quiet",
      "--depth",
      "1",
      `file://${repoWithRenames()}`,
      shallow,
    );

    expect(() => pathsMovedAway(shallow)).toThrow(/얕은 clone/);
  });

  it("git 저장소가 아니면 실패한다", () => {
    expect(() => pathsMovedAway(join(tempRoot(), "missing"))).toThrow(/git/);
  });

  it("이름 변경 기록이 비었으면 조용히 통과하지 않고 실패한다", () => {
    const repo = tempRoot();
    git(repo, "init", "--quiet");
    write(repo, "src/only.ts", "export const only = 1;\n");
    commitAll(repo, "처음");

    expect(() => pathsMovedAway(repo)).toThrow(/이름 변경 기록이 비었다/);
  });
});

describe("구 경로 잔존 검사 — 실제 저장소 회귀", () => {
  let renamedAway: string[];

  beforeAll(() => {
    renamedAway = pathsMovedAway(process.cwd());
  });

  it.each([
    "src/shared/lib/fontLoading.ts",
    "src/screens/notifications/hooks/pressNotification.ts",
    "src/features/payroll/model/query-keys.ts",
    legacyPath("scripts/font-subset", ".mts"),
    legacyPath("tests/lint/legacy-doc-paths", ".ts"),
    "src/screens/scheduleAdmin/ui/ConfirmSheet.tsx",
    "src/screens/scheduleWorker/ui/ScheduleAgenda.tsx",
    "src/screens/scheduleWorker/ui/DaySheet.tsx",
  ])("개명·이동 기록이 옛 경로 %s를 든다", (oldPath) => {
    expect(renamedAway).toContain(oldPath);
  });

  it("허용된 자리(ADR-004 결정 문장, sdlc-gate.md 패턴 열거 줄 등) 말고는 옛 경로가 안 남아 있다", () => {
    const violations = legacyPathViolations(process.cwd(), renamedAway);

    expect(violations).toEqual([]);
  });

  it("허용 항목마다 그 표지 문장이 옛 경로가 남은 줄을 실제로 가리킨다", () => {
    expect(staleAllowedLines(process.cwd(), renamedAway)).toEqual([]);
  });
});
