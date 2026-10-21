import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export type LegacyPathViolation = {
  file: string;
  pattern: string;
  line: number;
};

const DOCS = "docs/";

const DESIGN = `${DOCS}2-design/`;

const LEGACY_PATHS = [
  `${DOCS}plan.md`,
  `${DOCS}prd.md`,
  `${DOCS}domain`,
  `${DOCS}adr/`,
  `${DOCS}spec/`,
  `${DOCS}design-system/`,
  `${DESIGN}domain/`,
  `${DESIGN}architecture/`,
  `${DESIGN}design-system/pages/`,
];

const HISTORY_ROOTS = ["src", "scripts", "tests"];

const SOURCE_ROOT = "src/";

function gitOutput(repo: string, args: string[]): string {
  const result = spawnSync(
    "git",
    ["-C", repo, "-c", "core.quotePath=false", ...args],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );

  if (result.error || result.status !== 0) {
    const reason = result.error?.message ?? result.stderr.trim();
    throw new Error(
      `${repo}에서 git ${args.join(" ")}을 못 돌렸다. 이름 변경 기록은 git 이력에서 읽는다: ${reason}`,
    );
  }

  return result.stdout;
}

export function pathsRenamedAway(repo: string): string[] {
  const shallow = gitOutput(repo, ["rev-parse", "--is-shallow-repository"]);
  if (shallow.trim() === "true") {
    throw new Error(
      `${repo}는 얕은 clone이라 이름 변경 기록을 못 읽는다. git fetch --unshallow로 이력을 다 받은 뒤 다시 돌린다.`,
    );
  }

  const renameLog = gitOutput(repo, [
    "log",
    "--diff-filter=R",
    "--name-status",
    "--format=",
    "-M",
    "--",
    ...HISTORY_ROOTS,
  ]);
  const renamedAway = new Set(
    renameLog
      .split("\n")
      .map((line) => line.split("\t"))
      .filter((columns) => columns.length === 3)
      .map(([, from]) => from),
  );

  if (renamedAway.size === 0) {
    throw new Error(
      `${repo}의 ${HISTORY_ROOTS.join("·")} 이름 변경 기록이 비었다. 이력이 잘렸는지 본다.`,
    );
  }

  return [...renamedAway];
}

type FindInLine = (line: string) => string[];

const NAME_CHARACTER = /[\w-]/;

const BEFORE_STANDALONE = /[\w.-]/;

function leadingWordOf(pattern: string): string {
  return /^[\w-]*/.exec(pattern)?.[0] ?? "";
}

function standaloneFinder(patterns: string[]): FindInLine {
  const wanted = new Set(patterns);
  const leadingWords = new Set(patterns.map(leadingWordOf));
  const longest = Math.max(0, ...patterns.map((pattern) => pattern.length));

  return (line) => {
    const found: string[] = [];

    for (const word of line.matchAll(/[\w-]+/g)) {
      const start = word.index;
      if (
        !leadingWords.has(word[0]) ||
        BEFORE_STANDALONE.test(line[start - 1] ?? "")
      ) {
        continue;
      }

      const last = Math.min(line.length, start + longest);
      for (let end = start + word[0].length; end <= last; end += 1) {
        const candidate = line.slice(start, end);
        if (!NAME_CHARACTER.test(line[end] ?? "") && wanted.has(candidate)) {
          found.push(candidate);
        }
      }
    }

    return found;
  };
}

const SIBLING_RUN = /`([^`\s]*\/)[^`\s/]+`((?:\s*[·,]\s*`[^`\s/]+`)+)/g;

const SIBLING_NAME = /`([^`]+)`/g;

const LEADING_RELATIVE = /^(?:\.\.?\/)+/;

function siblingPathsIn(line: string): string[] {
  return [...line.matchAll(SIBLING_RUN)].flatMap(([, folder, names]) =>
    [...names.matchAll(SIBLING_NAME)].map(
      ([, name]) => `${folder.replace(LEADING_RELATIVE, "")}${name}`,
    ),
  );
}

type RenamedPatterns = {
  inEveryFile: FindInLine;
  outsideCode: FindInLine;
  siblingTargets: Set<string>;
};

function renamedPatternsFor(
  presentFiles: string[],
  renamedAway: string[],
): RenamedPatterns {
  const present = new Set(presentFiles);
  const presentNames = new Set(presentFiles.map((file) => path.basename(file)));
  const gone = renamedAway.filter((oldPath) => !present.has(oldPath));

  const nameOrPath = (oldPath: string) => {
    const name = path.basename(oldPath);
    return presentNames.has(name) ? oldPath : name;
  };
  const outsideSource = gone
    .filter((oldPath) => !oldPath.startsWith(SOURCE_ROOT))
    .map(nameOrPath);
  const insideSource = gone.filter((oldPath) =>
    oldPath.startsWith(SOURCE_ROOT),
  );

  return {
    inEveryFile: standaloneFinder(outsideSource),
    outsideCode: standaloneFinder(insideSource),
    siblingTargets: new Set(
      [...outsideSource, ...insideSource].filter((pattern) =>
        pattern.includes("/"),
      ),
    ),
  };
}

function fileName(stem: string, extension: string): string {
  return `${stem}${extension}`;
}

const OLD_SEED_SESSION = fileName("seed-session", ".js");

const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".mjs", ".js"]);

const SCANNED_ROOTS = [
  "CLAUDE.md",
  ".claude",
  ".github",
  ".githooks",
  "docs",
  "eslint-rules",
  "scripts",
  "src",
  "supabase",
  "tests",
];

const EXCLUDED_PREFIXES = [`${DOCS}log/`, ".claude/worktrees/"];

const SKIPPED_DIRECTORIES = new Set(["node_modules", "__pycache__"]);

const BINARY_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".otf",
  ".pdf",
  ".png",
  ".pyc",
  ".ttf",
  ".webp",
  ".woff",
  ".woff2",
]);

export type AllowedLine = {
  file: string;
  marker: string;
};

export const ALLOWED_LINES: AllowedLine[] = [
  {
    file: "docs/2-design/adr/ADR-004-domain-rules-home.md",
    marker: "디렉터리로 연다",
  },
  {
    file: "docs/3-build/plans/sdlc-gate.md",
    marker: "옮기기 전 경로",
  },
  {
    file: "docs/2-design/adr/ADR-002-sdd-ddd-tdd.md",
    marker: `\`${DESIGN}domain/`,
  },
  {
    file: "docs/2-design/adr/ADR-004-domain-rules-home.md",
    marker: `${DESIGN}domain/`,
  },
  {
    file: "docs/3-build/plans/session-foundation.md",
    marker: `\`${DESIGN}domain/account.md\``,
  },
  {
    file: "docs/3-build/plans/doc-map-links.md",
    marker: `\`${DESIGN}architecture/README.md\``,
  },
  {
    file: "docs/proposals/docs-structure-followup.md",
    marker: "**수정 대상.**",
  },
  {
    file: "tests/lint/e2eFileReferences.test.ts",
    marker: `reference: "scripts/${OLD_SEED_SESSION}"`,
  },
  {
    file: "tests/lint/fileNaming.test.ts",
    marker: 'camelWanted: "src/shared/api/',
  },
  {
    file: "tests/lint/fileNaming.test.ts",
    marker: 'camelWantedTest: "tests/lint/',
  },
  {
    file: "tests/lint/fileNaming.test.ts",
    marker: 'expect(stemOf("database-',
  },
  {
    file: "docs/3-build/plans/schedule-data.md",
    marker: "디렉터리가 없어",
  },
  {
    file: "docs/proposals/canon-and-code-divergence.md",
    marker:
      "[.claude/agents/sian-auditor.md](../../.claude/agents/sian-auditor.md):27",
  },
  {
    file: "docs/proposals/canon-and-code-divergence.md",
    marker: "가리키는 자리가 그 결과다",
  },
  {
    file: "docs/backlog.md",
    marker: "`legacy-bare-script-names`",
  },
  {
    file: "tests/lint/e2eFileReferences.test.ts",
    marker: `"seedSession.js", "${OLD_SEED_SESSION}")`,
  },
  {
    file: "docs/backlog.md",
    marker: "`legacy-intermediate-names`",
  },
  {
    file: "docs/observations/035-edge-function-reaches-outside-mount.md",
    marker: '} from "../../../src/features/payroll/model/',
  },
  {
    file: "docs/observations/050-comment-paths-checked-by-nothing.md",
    marker: "useQrCodeQuery.test.ts:4",
  },
  {
    file: "docs/observations/050-comment-paths-checked-by-nothing.md",
    marker: "// 구현 대상: ",
  },
  {
    file: "docs/observations/050-comment-paths-checked-by-nothing.md",
    marker: "그 파일은 `",
  },
  {
    file: "docs/observations/051-reexport-bypasses-segment-checks.md",
    marker: "monthState.policy.ts:52",
  },
  {
    file: "docs/observations/archive/006-tdd-guard-e2e-screens-ts.md",
    marker: "login-screens 회차에서 unit-test-writer가",
  },
  {
    file: "docs/observations/archive/030-export-gate-needs-complete-writer-assignment.md",
    marker: "TDD 차단: ",
  },
  {
    file: "docs/observations/archive/039-e2e-only-assignment-blocks-the-hook.md",
    marker: "를 만들려다 멈췄다",
  },
  {
    file: "docs/proposals/canon-and-code-divergence.md",
    marker: "(../4-test/evidence/expo-scaffold.md):36",
  },
  {
    file: "docs/proposals/post-refactor-audit.md",
    marker: "pressNotification.ts:20",
  },
  {
    file: "docs/proposals/post-refactor-audit.md",
    marker: "폴더에 훅이 아닌 함수 파일",
  },
  {
    file: "docs/3-build/plans/screens-calc-placement.md",
    marker: "는 세 줄이고 `qrcode` 패키지를",
  },
  {
    file: "docs/3-build/plans/screens-calc-placement.md",
    marker: "는 `navigate`와 `markRead`를 인자로 받아",
  },
  {
    file: "docs/3-build/plans/screens-calc-placement.md",
    marker: "자리는 그대로고 `shared/utils`로 올라간다",
  },
  {
    file: "docs/3-build/plans/screens-calc-placement.md",
    marker: "흐름이 `hooks`로 간다",
  },
  {
    file: "docs/3-build/plans/reexport-launders-layers.md",
    marker: "monthState.policy.ts:35",
  },
  {
    file: "docs/3-build/plans/reexport-launders-layers.md",
    marker: "monthEmptyState.policy.ts:9",
  },
  {
    file: "docs/3-build/plans/reexport-launders-layers.md",
    marker: "| `kstDateOf` | `formatScheduleDate.utils` |",
  },
  {
    file: "docs/3-build/plans/auth-entry.md",
    marker: "`src/middleware.ts`",
  },
  {
    file: "docs/3-build/plans/attendance-excuse.md",
    marker: "/attendance-column.",
  },
  {
    file: "docs/3-build/plans/schedule-worker.md",
    marker: "/attendance-column.",
  },
  {
    file: "tests/lint/noFocusedTests.test.ts",
    marker: `회귀 — ${fileName("utils", ".test.ts")}는`,
  },
];

function* filesUnder(root: string, relative: string): Generator<string> {
  let entries;
  try {
    entries = readdirSync(path.join(root, relative), { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const child = `${relative}/${entry.name}`;

    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name) || entry.name.startsWith(".")) {
        continue;
      }
      yield* filesUnder(root, child);
    } else if (entry.isFile()) {
      yield child;
    }
  }
}

function presentFilesIn(root: string): string[] {
  return SCANNED_ROOTS.flatMap((entry) => {
    let stats;
    try {
      stats = statSync(path.join(root, entry));
    } catch {
      return [];
    }

    return stats.isDirectory() ? [...filesUnder(root, entry)] : [entry];
  }).filter(
    (file) => !EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix)),
  );
}

function isScannable(file: string): boolean {
  return !BINARY_EXTENSIONS.has(path.extname(file).toLowerCase());
}

function isAllowed(file: string, line: string): boolean {
  return ALLOWED_LINES.some(
    (allowed) => allowed.file === file && line.includes(allowed.marker),
  );
}

function linesOf(root: string, file: string): string[] {
  return readFileSync(path.join(root, file), "utf8").split("\n");
}

function legacyPatternsIn(
  file: string,
  line: string,
  renamed: RenamedPatterns,
): string[] {
  const found = [
    ...LEGACY_PATHS.filter((pattern) => line.includes(pattern)),
    ...renamed.inEveryFile(line),
  ];

  if (!CODE_EXTENSIONS.has(path.extname(file))) {
    found.push(
      ...renamed.outsideCode(line),
      ...siblingPathsIn(line).filter((sibling) =>
        renamed.siblingTargets.has(sibling),
      ),
    );
  }

  return [...new Set(found)];
}

export function legacyPathViolations(
  root: string,
  renamedAway: string[],
): LegacyPathViolation[] {
  const presentFiles = presentFilesIn(root);
  const renamed = renamedPatternsFor(presentFiles, renamedAway);
  const violations: LegacyPathViolation[] = [];

  for (const file of presentFiles.filter(isScannable)) {
    for (const [index, line] of linesOf(root, file).entries()) {
      if (isAllowed(file, line)) {
        continue;
      }

      for (const pattern of legacyPatternsIn(file, line, renamed)) {
        violations.push({ file, pattern, line: index + 1 });
      }
    }
  }

  return violations;
}

function coversALegacyLine(
  root: string,
  renamed: RenamedPatterns,
  { file, marker }: AllowedLine,
) {
  let lines;
  try {
    lines = linesOf(root, file);
  } catch {
    return false;
  }

  return lines.some(
    (line) =>
      line.includes(marker) && legacyPatternsIn(file, line, renamed).length > 0,
  );
}

export function staleAllowedLines(
  root: string,
  renamedAway: string[],
): AllowedLine[] {
  const renamed = renamedPatternsFor(presentFilesIn(root), renamedAway);

  return ALLOWED_LINES.filter(
    (allowed) => !coversALegacyLine(root, renamed, allowed),
  );
}
